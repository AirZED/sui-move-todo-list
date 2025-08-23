#[test_only]
module todo_list::todo_list_tests;

use std::string;
use sui::test_scenario;
use todo_list::todo_list::{Self, TodoList};

#[test]
fun test_create_todolist() {
    let user = @0xCa;
    let mut scenario = test_scenario::begin(user);

    {
        let ctx = scenario.ctx();
        let list = todo_list::new(b"Test Todo".to_string(), ctx);
        transfer::public_share_object(list);
    };

    scenario.next_tx(user);
    {
        let list = test_scenario::take_shared<TodoList>(&scenario);

        assert!(todo_list::length(&list) == 0, 0);
        assert!(list.name() == b"Test Todo".to_string(), 1);

        test_scenario::return_shared(list);
    };

    scenario.end();
}

#[test]
fun add_item_to_todo() {
    let user = @0xCa;
    let mut scenario = test_scenario::begin(user);

    {
        let ctx = scenario.ctx();
        let list = todo_list::new(string::utf8(b"Test"), ctx);
        transfer::public_share_object(list);
    };

    scenario.next_tx(user);
    {
        let mut list = test_scenario::take_shared<TodoList>(&scenario);
        todo_list::add(&mut list, b"Item 1".to_string());
        todo_list::add(&mut list, b"Item 2".to_string());
        todo_list::remove(&mut list, 0);

        assert!(todo_list::length(&list) == 1, 3);

        test_scenario::return_shared(list);
    };

    scenario.end();
}

#[test]
fun remove_item_from_todo() {
    let user = @0xCa;
    let item1 = string::utf8(b"Item1");
    let item2 = string::utf8(b"Item2");
    let item3 = string::utf8(b"Item3");

    let mut scenario = test_scenario::begin(user);

    {
        let ctx = scenario.ctx();
        let list = todo_list::new(string::utf8(b"Test"), ctx);
        transfer::public_share_object(list);
    };

    scenario.next_tx(user);
    {
        let mut list = test_scenario::take_shared<TodoList>(&scenario);
        todo_list::add(&mut list, item1);
        todo_list::add(&mut list, item2);
        todo_list::add(&mut list, item3);
        assert!(todo_list::length(&list) == 3, 0);
        test_scenario::return_shared(list);
    };

    scenario.next_tx(user);
    {
        let mut list = test_scenario::take_shared<TodoList>(&scenario);
        todo_list::remove(&mut list, 0);

        assert!(todo_list::length(&list)==2, 0);

        test_scenario::return_shared(list);
    };

    scenario.end();
}
