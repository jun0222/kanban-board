import React, {useState, useEffect, useReducer } from 'react';
import Amplify, { Auth } from "aws-amplify";
import API, { graphqlOperation } from '@aws-amplify/api';
import awsmobile from "../aws-exports";
import { withAuthenticator } from "aws-amplify-react";
import { createTodo } from '../graphql/mutations';
import { listTodos } from '../graphql/queries';
import { onCreateTodo } from '../graphql/subscriptions';
import styled, { createGlobalStyle } from 'styled-components';
import * as color from './_color';
import { Header } from './Header';
import { Column } from './Column';

// Amplifyの設定を行う
Amplify.configure(awsmobile)

const GET = 'GET';
const CREATE = 'CREATE';

type Todo = {
  id: string,
  title: string,
  detail: string,
  createdAt: string,
  updatedAt: string
}

const reducer = (state: {todos: []}, action: any) => {
  switch (action.type) {
    case GET:
      return {...state, todos: action.todos};
    case CREATE:
      return {...state, todos:[...state.todos, action.todo]}
    default:
      return state;
  }
};

const initialState = {
  todos: [],
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

const Home = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [user, setUser] = useState({attributes: {}, id: '', username: ''});
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');

  function onChange(e: {target: {id: string, value: string}}){
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
      const user: {attributes: {}, id: string, username: string} = await Auth.currentUserInfo();
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
      {/* 簡易todo用UI */}
      {/* <p>user: {user!= null && user.username}</p>
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
          {state.todos && state.todos.map((todo: Todo, index: number) => {
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
      </div> */}

      {/* カンバンボード用UI */}
      <div>
      <GlobalStyle />
      <Container>
        <Header />

        <MainArea>
          <HorizontalScroll>
          <Column
            title="TODO"
            cards={[
              { id: 'a', text: '朝食をとる🍞' },
              { id: 'b', text: 'SNSをチェックする🐦' },
              { id: 'c', text: '布団に入る (:3[___]' },
            ]}
          />
          <Column
            title="Doing"
            cards={[
              { id: 'd', text: '顔を洗う👐' },
              { id: 'e', text: '歯を磨く🦷' },
            ]}
          />
          <Column title="Waiting" cards={[]} />
          <Column
            title="Done"
            cards={[{ id: 'f', text: '布団から出る (:3っ)っ -=三[＿＿]' }]}
          />
          </HorizontalScroll>
        </MainArea>
      </Container>
      </div>
    </div>
  );
}

const GlobalStyle = createGlobalStyle`
html, body, #app {
  height: 100%;
}

body {
  /* https://css-tricks.com/snippets/css/system-font-stack/ */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;

  overflow-wrap: break-word;
}
`

const Container = styled.div`
display: flex;
flex-flow: column;
height: 100%;
`

const Logo = styled.div`
height: 100%;
padding: 16px 0;
overflow-y: auto;
`

const CardFilter = styled.input`
display: flex;
align-items: center;
min-width: 300px;
border: solid 1px ${color.Silver};
border-radius: 3px;
`

const MainArea = styled.div`
height: 100%;
padding: 16px 0;
overflow-y: auto;
`

const HorizontalScroll = styled.div`
display: flex;
width: 100%;
height: 100%;
overflow-x: auto;

> * {
  margin-left: 16px;
  flex-shrink: 0;
}

::after {
  display: block;
  flex: 0 0 16px;
  content: '';
}
`

const ColumnHeader = styled.div`
display: flex;
justify-content: flex-start;
align-items: center;
padding: 8px;
`

const Card = styled.div`
position: relative;
border: solid 1px ${color.Silver};
border-radius: 6px;
box-shadow: 0 1px 3px hsla(0, 0%, 7%, 0.1);
padding: 8px 32px;
background-color: ${color.White};
cursor: move;
`

// Appコンポーネントをラップする
export default withAuthenticator(Home, false, [], null, {signUpConfig});