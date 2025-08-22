/// Module: todo_list
module todo_list::todo_list;

use std::string::String;

//Create todolist
//add task to todolist
//delete task from todolist
//delete todo list

/// list of todos. Can be managed by the owner and shared with others
public struct TodoList has key, store {
    id: UID,
    name: String,
    items: vector<String>,
}

///create a new todo list
public fun new(name: String, ctx: &mut TxContext): TodoList {
    let list = TodoList {
        id: object::new(ctx),
        items: vector[],
        name: name,
    };

    list
}

public fun add(list: &mut TodoList, item: String) {
    list.items.push_back(item);
}

public fun remove(list: &mut TodoList, index: u64): String {
    list.items.remove(index)
}

public fun delete(list: TodoList) {
    let TodoList { id, items: _, name: _ } = list;
    id.delete();
}

public fun length(list: &TodoList): u64 {
    list.items.length()
}

public fun name(self: &TodoList): String {
    self.name
}
