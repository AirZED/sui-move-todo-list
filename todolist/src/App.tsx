import { useState, useEffect } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { ConnectButton } from "@mysten/dapp-kit";
import {
  useSuiClient,
  useSignAndExecuteTransaction,
  useCurrentAccount,
  useCurrentWallet,
} from "@mysten/dapp-kit";

// Replace with your deployed package ID
const PACKAGE_ID =
  "0xa0036903b27425e76eb3eafc7c2dfa640c74735d026b1a695cfc91c4b411f137"; // e.g., '0x123...'
const MODULE_NAME = "todo_list";
const TODO_LIST_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::TodoList`;

function App() {
  const client = useSuiClient();
  const wallet = useCurrentWallet();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [todoLists, setTodoLists] = useState<{ id: string; name: string }[]>(
    []
  );
  const [selectedTodoListId, setSelectedTodoListId] = useState<string | null>(
    null
  );
  const [name, setName] = useState<string>("My Todo List");
  const [newItem, setNewItem] = useState<string>("");
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch owned TodoLists when account changes
  useEffect(() => {
    if (account) {
      fetchOwnedTodoLists();
    } else {
      setTodoLists([]);
      setSelectedTodoListId(null);
      setItems([]);
    }
  }, [account]);

  // Fetch items when selectedTodoListId changes
  useEffect(() => {
    if (selectedTodoListId) {
      fetchItems();
    } else {
      setItems([]);
    }
  }, [selectedTodoListId]);

  const fetchOwnedTodoLists = async () => {
    setLoading(true);
    setError(null);
    try {
      const objects = await client.getOwnedObjects({
        owner: account!.address,
        filter: { StructType: TODO_LIST_TYPE },
        options: { showContent: true },
      });

      const lists = objects.data.map((obj) => {
        const content = obj.data?.content as any;
        return {
          id: obj.data!.objectId,
          name: content.fields.name || "Unnamed",
        };
      });

      setTodoLists(lists);
      if (lists.length > 0 && !selectedTodoListId) {
        setSelectedTodoListId(lists[0].id);
      }
    } catch (err) {
      setError("Failed to fetch owned TodoLists");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    if (!selectedTodoListId) return;
    setLoading(true);
    try {
      const object = await client.getObject({
        id: selectedTodoListId,
        options: { showContent: true },
      });
      const content = object.data?.content as any;
      if (content?.type === TODO_LIST_TYPE) {
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
      const result = await signAndExecute({
        transaction: tx,
      });
      await client.waitForTransaction({
        digest: result.digest,
        options: {
          showEffects: true,
        },
      });

      const eventResult = await client.queryEvents({
        query: { Transaction: result.digest },
      });

      console.log(eventResult, "This is the event result");

      const newId = result.effects?.created?.[0]?.reference.objectId;
      if (newId) {
        setTodoLists([...todoLists, { id: newId, name }]);
        setSelectedTodoListId(newId);
        setName("My Todo List");
      }
    } catch (err) {
      setError("Failed to create TodoList");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteTodoList = async (id: string) => {
    if (!account) return;
    setLoading(true);
    setError(null);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::destroy`,
        arguments: [tx.object(id)],
      });
      const result = await signAndExecute({
        transaction: tx,
      });
      console.log(result);
      setTodoLists(todoLists.filter((list) => list.id !== id));
      if (selectedTodoListId === id) {
        setSelectedTodoListId(null);
        setItems([]);
      }
    } catch (err) {
      setError("Failed to delete TodoList");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!account || !selectedTodoListId || !newItem) return;
    setLoading(true);
    setError(null);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::add`,
        arguments: [tx.object(selectedTodoListId), tx.pure.string(newItem)],
      });
      const result = await signAndExecute({
        transaction: tx,
      });
      console.log(result);
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
    if (!account || !selectedTodoListId) return;
    setLoading(true);
    setError(null);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::remove`,
        arguments: [tx.object(selectedTodoListId), tx.pure.u64(index)],
      });
      const result = await signAndExecute({
        transaction: tx,
      });
      console.log(result);
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
          <div className="mb-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-2"
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
          <h2 className="text-xl font-semibold mb-2">Your Todo Lists</h2>
          {todoLists.length === 0 ? (
            <p className="text-gray-500">No todo lists yet</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {todoLists.map((list) => (
                <li
                  key={list.id}
                  className={`flex justify-between items-center p-2 rounded cursor-pointer ${
                    selectedTodoListId === list.id
                      ? "bg-blue-100"
                      : "bg-gray-50"
                  }`}
                  onClick={() => setSelectedTodoListId(list.id)}
                >
                  <span>{list.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTodoList(list.id);
                    }}
                    disabled={loading}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selectedTodoListId && (
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Tasks for{" "}
                {todoLists.find((l) => l.id === selectedTodoListId)?.name}
              </h2>
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
            </div>
          )}
          {loading && <p className="mt-4 text-blue-500">Loading...</p>}
        </div>
      )}
    </div>
  );
}

export default App;
