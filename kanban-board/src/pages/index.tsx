import React, {useState, useEffect, useReducer } from 'react';
import Amplify, { Auth } from "aws-amplify";
import API, { graphqlOperation } from '@aws-amplify/api';
import awsmobile from "../aws-exports";
import { withAuthenticator } from "aws-amplify-react";
import { createTodo } from '../graphql/mutations';
import { listTodos } from '../graphql/queries';
import { onCreateTodo } from '../graphql/subscriptions';

// Amplifyの設定を行う
Amplify.configure(awsmobile)

const GET = 'GET';
const CREATE = 'CREATE';

const initialState = {
  todos: [],
};

const reducer = (state: any, action: any) => {
  switch (action.type) {
    case GET:
      return {...state, todos: action.todos};
    case CREATE:
      return {...state, todos:[...state.todos, action.todo]}
    default:
      return state;
  }
};

// SingUp時に、メールアドレスとパスワードを要求する
const signUpConfig = {
  header: 'Sign Up',
  hideAllDefaults: true,
  defaultCountyCode: '1',
  signUpFields: [
      {
          label: 'User Name',
          key: 'username',
          required: true,
          displayOrder: 1,
          type: 'string'
      },
      {
          label: 'Email',
          key: 'email',
          required: true,
          displayOrder: 2,
          type: 'string'
      },
      {
          label: 'Password',
          key: 'password',
          required: true,
          displayOrder: 3,
          type: 'password'
      }
  ]
}

// SingOut
function signOut(){
  Auth.signOut()
  .then()
  .catch();
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [user, setUser]: any = useState();
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');

  function onChange(e: any){
    if(e.target.id === 'title'){
      setTitle(e.target.value);
    }
    if(e.target.id === 'detail'){
      setDetail(e.target.value);
    }
  }

  async function create(e: any) {
    e.preventDefault();
    setTitle('')
    setDetail('')
    const todo = { title:title, detail:detail };
    await API.graphql(graphqlOperation(createTodo, { input: todo }));
  }

  useEffect(() => {

    async function getUser(){
      const user: any = await Auth.currentUserInfo();
      setUser(user);
      return user
    }

    getUser();

    async function getData() {
      const todoData: any = await API.graphql(graphqlOperation(listTodos));
      dispatch({ type: GET, todos: todoData.data.listTodos.items });
    }

    getData();

    const client = API.graphql(graphqlOperation(onCreateTodo));
    ((client: any) => {
      const subscription = client.subscribe({
        next: (eventData: any) => {
          const todo = eventData.value.data.onCreateTodo;
          dispatch({ type: CREATE, todo });
        }
      });
      return () => subscription.unsubscribe();
    })(client);
  }, []);


  return (
    <div className="App">
      <p>user: {user!= null && user.username}</p>
      <button onClick={signOut}>Sign out</button>
      <div>
        <table>
          <tr>
            <th>No</th>
            <th>Title</th>
            <th>Detail</th>
            <th></th>
          </tr>
          <tr>
            <td></td>
            <td><input id='title' type='text' onChange={onChange} value={title}/></td>
            <td><input id='detail' type='text' onChange={onChange} value={detail}/></td>
            <th><button onClick={create}>New</button></th>
          </tr>
          {state.todos && state.todos.map((todo: any, index: any) => {
            return(
              <tr key={todo.id}>
                <td>{index + 1}</td>
                <td>{todo.title}</td>
                <td>{todo.detail}</td>
                <td>{todo.createdAt}</td>
              </tr>
            )
          })}
        </table>
      </div>
    </div>
  );
}

// Appコンポーネントをラップする
export default withAuthenticator(App, false, [], null, {signUpConfig});