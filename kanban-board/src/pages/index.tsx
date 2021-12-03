import React, {useState, useEffect, useReducer } from 'react';
import Amplify, { Auth } from "aws-amplify";
import API, { graphqlOperation } from '@aws-amplify/api';
import awsmobile from "../aws-exports";
import { withAuthenticator } from "aws-amplify-react";
import { createTodo } from '../graphql/mutations';
import { listCards, listTodos, listColumns, listOrders } from '../graphql/queries';
import { onCreateTodo } from '../graphql/subscriptions';
import styled, { createGlobalStyle } from 'styled-components';
import * as color from './_color';
import { Header } from './Header';
import { Column } from './Column';
import produce from 'immer';
import { randomID, sortBy } from './_util'

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

type Columns = {
  id: string
  title?: string
  text?: string
  cards?: {
    id: string
    text?: string
  }[]
}[]


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
  const [columns, setColumns] = useState<Columns>([])

  const [draggingCardID, setDraggingCardID] = useState<string | undefined>(
    undefined,
  )

  const dropCardTo = (toID: string) => {
    const fromID = draggingCardID
    if (!fromID) return

    setDraggingCardID(undefined)

    if (fromID === toID) return

    setColumns(columns => {
      const card = columns.flatMap(col => col.cards).find(c => c.id === fromID)
      if (!card) {
        return columns
      }

      return columns.map(column => {
        let newColumn = column

        if (newColumn.cards.some(c => c.id === fromID)) {
          newColumn = {
            ...newColumn,
            cards: newColumn.cards.filter(c => c.id !== fromID),
          }
        }

        // 列の末尾に移動
        if (newColumn.id === toID) {
          newColumn = {
            ...newColumn,
            cards: [...newColumn.cards, card],
          }
        }
        // 列の末尾以外に移動
        else if (newColumn.cards.some(c => c.id === toID)) {
          newColumn = {
            ...newColumn,
            cards: newColumn.cards.flatMap(c =>
              c.id === toID ? [card, c] : [c],
            ),
          }
        }

        return newColumn
      })
    })
  }



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

    ;(async () => {
      const todoColumns: any = await API.graphql(graphqlOperation(listColumns));
      const unorderedCards: any = await API.graphql(graphqlOperation(listCards));
      const cardsOrder: any = await API.graphql(graphqlOperation(listOrders));

      // { item.id: item.next, item.id: item.next..... } 形式のオブジェクトを生成
      let cardsOrderShaped: any = {}
      cardsOrder.data.listOrders.items.forEach(item => {
        cardsOrderShaped[item.id] = item.next
      })
      
        todoColumns.data.listColumns.items.forEach(item => {
          item.cards = sortBy(unorderedCards.data.listCards.items, cardsOrderShaped, item.id)
        })
        setColumns(todoColumns.data.listColumns.items)

    })()

    async function getUser(){
      const user: {attributes: {}, id: string, username: string} = await Auth.currentUserInfo();
      setUser(user);
      return user
    }

    getUser();

    async function getData() {
      const todoCard: any = await API.graphql(graphqlOperation(listCards));
      dispatch({ type: GET, todos: todoCard.data.listCards.items });
    }

    getData();

    async function getColumn() {
      const todoColumns: any = await API.graphql(graphqlOperation(listCards));
      dispatch({ type: GET, columns: todoColumns.data });
    }

    getColumn();

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
      {/* カンバンボード用UI */}
      <p>user: {user!= null && user.username}</p>
      <button onClick={signOut}>Sign out</button>
      <div>
      <GlobalStyle />
      <Container>
        <Header />
        <MainArea>
          <HorizontalScroll>
          {columns.map(({ id: columnID, title, cards }) => (
            <Column
              key={columnID}
              cid={columnID}
              title={title}
              cards={cards}
              onCardDragStart={cardID => setDraggingCardID(cardID)}
              onCardDrop={entered => dropCardTo(entered ?? columnID)}
            />
          ))}
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