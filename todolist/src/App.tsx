import { useState, useEffect } from "react";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { ConnectButton, useWallet } from "@suiet/wallet-kit";

export const client = new SuiClient({
  url: getFullnodeUrl("devnet"),
});

// Replace with your deployed package ID
const PACKAGE_ID =
  "0xa0036903b27425e76eb3eafc7c2dfa640c74735d026b1a695cfc91c4b411f137"; // e.g., '0x123...'
// Module name
const MODULE_NAME = "todo_list";

function App() {
  const wallet = useWallet();
  const account = wallet.account;

  const [todoListId, setTodoListId] = useState<string | null>(null);
  const [name, setName] = useState<string>("My Todo List");
  const [newItem, setNewItem] = useState<string>("");
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch items when todoListId changes
  useEffect(() => {
    if (todoListId) {
      fetchItems();
    }
  }, [todoListId]);

  const fetchItems = async () => {
    if (!todoListId) return;
    setLoading(true);
    try {
      const object = await client.getObject({
        id: todoListId,
        options: { showContent: true },
      });
      const content = object.data?.content as any;
      if (content?.type.endsWith("TodoList")) {
        setItems(content.fields.items || []);
      } else {
        setError("Invalid TodoList object");
      }
    } catch (err) {
      setError("Failed to fetch items");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createTodoList = async () => {
    if (!account) return;
    setLoading(true);
    setError(null);
    try {
      const tx = new Transaction();
      const [todoList] = tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::new`,
        arguments: [tx.pure.string(name)],
      });
      tx.transferObjects([todoList], account.address); // Or share if needed: tx.shareObject(todoList);
      const result = await wallet.signTransaction({
        transaction: tx,
      });

      // await client.waitForTransaction({ digest: result.digest });
      // Extract object ID from created objects
      // const created = result.objectChanges?.find(
      //   (change) => change.type === "created"
      // );
      // if (created && "objectId" in created) {
      //   setTodoListId(created.objectId);
      // }
    } catch (err) {
      setError("Failed to create TodoList");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!account || !todoListId || !newItem) return;
    setLoading(true);
    setError(null);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::add`,
        arguments: [tx.object(todoListId), tx.pure.string(newItem)],
      });
      const result = await wallet.signTransaction({
        transaction: tx,
      });

      console.log(result);
      // await client.waitForTransaction({ digest: result.digest });
      setNewItem("");
      fetchItems();
    } catch (err) {
      setError("Failed to add item");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (index: number) => {
    if (!account || !todoListId) return;
    setLoading(true);
    setError(null);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::remove`,
        arguments: [tx.object(todoListId), tx.pure.u64(index)],
      });
      const result = await wallet.signTransaction({
        transaction: tx,
      });

      console.log(result);
      // await client.waitForTransaction({ digest: result.digest });
      fetchItems();
    } catch (err) {
      setError("Failed to remove item");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-black min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <ConnectButton />
      {!account ? (
        <p className="mt-4 text-red-500">Please connect your wallet</p>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4">Todo List App</h1>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {!todoListId ? (
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-4 "
                placeholder="Todo List Name"
              />
              <button
                onClick={createTodoList}
                disabled={loading}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                {loading ? "Creating..." : "Create Todo List"}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex mb-4">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-l"
                  placeholder="New Task"
                />
                <button
                  onClick={addItem}
                  disabled={loading}
                  className="bg-green-500 text-white p-2 rounded-r hover:bg-green-600"
                >
                  Add
                </button>
              </div>
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center bg-gray-50 p-2 rounded"
                  >
                    <span>{item}</span>
                    <button
                      onClick={() => removeItem(index)}
                      disabled={loading}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              {items.length === 0 && (
                <p className="text-gray-500">No tasks yet</p>
              )}
              {loading && <p className="mt-4 text-blue-500">Loading...</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
