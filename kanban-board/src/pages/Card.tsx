import React, {useState, useRef } from 'react'
import styled from 'styled-components'
import * as color from './_color'
import { CheckIcon as _CheckIcon, TrashIcon } from './icon'
import API, { graphqlOperation } from '@aws-amplify/api';
import { deleteCard, deleteOrder, createOrder } from '../graphql/mutations';
import { listOrders } from '../graphql/queries';

Card.DropArea = DropArea;

export function Card({
    onClickDelete,
    id,
    text,
    onDragStart,
    onDragEnd
}: {
    onClickDelete(deleteCardId: string): void
    id: string
    text?: string
    onDragStart?(): void
    onDragEnd?(): void
}) {
    const [drag, setDrag] = useState(false);
    const deleteCardFunc = async () => {

        onClickDelete(id);

        // cardの削除
        const card = {id: id};
        await API.graphql(graphqlOperation(deleteCard, { input: card }));
        const allOrders: any = await API.graphql(graphqlOperation(listOrders));

        // クリックしたcardがcolumnの一番下かどうか判定
        if (allOrders.data.listOrders.items.find((v: any) => v.id == id) === undefined) {
            // columnの一番下
            const deleteOrderID = allOrders.data.listOrders.items.find((v: any) => v.next === id).id
            const order = {id: deleteOrderID}
            await API.graphql(graphqlOperation(deleteOrder, { input: order }));
        } else {
            // columnの一番下以外

            // クリックしたcardの次にあるcardのidを取得
            const nextCardId = allOrders.data.listOrders.items.find((v: any) => v.id === id).next;
            
            // 既存のorderを削除
            // クリックしたcardのidがnextに格納されているorder
            const deleteOrderID = allOrders.data.listOrders.items.find((v: any) => v.next === id).id
            const order = {id: deleteOrderID}
            await API.graphql(graphqlOperation(deleteOrder, { input: order }));
            // クリックしたcardのidがidに格納されているorder
            const order2 = {id: id}
            await API.graphql(graphqlOperation(deleteOrder, { input: order2 }));

            // クリックしたcardの一つ前をid、一つ後をnextに格納したorderを作成
            const preCardId = allOrders.data.listOrders.items.find((v: any) => v.next === id).id;
            const upOrder = {id: preCardId, next: nextCardId};
            await API.graphql(graphqlOperation(createOrder, { input: upOrder }));
        };
    }
    return (
        <Container
            style={{ opacity: drag ? 0.5 : undefined }}
            onDragStart={() => {
                onDragStart?.()
                setDrag(true)
            }}
            onDragEnd={() => {
                onDragEnd?.()
                setDrag(false)
            }}
        >
            <CheckIcon />
            {text?.split(/(https?:\/\/\S+)/g).map((fragment, i) =>
                i % 2 === 0 ? (
                    <Text key={i}>{fragment}</Text>
                ) : (
                    <Link key={i} href={fragment}>
                        {fragment}
                    </Link>
                ),
            )}
            <DeleteButton
                onClick={deleteCardFunc}
            />
        </Container>
    )
}

const Container = styled.div.attrs({
    draggable: true,
})`
    position: relative;
    border: solid 1px ${color.Silver};
    border-radius: 6px;
    box-shadow: 0 1px 3px hsla(0, 0%, 7%, 0.1);
    padding: 8px 32px;
    background-color: ${color.White};
    cursor: move;
`

const CheckIcon = styled(_CheckIcon)`
    position: absolute;
    top: 12px;
    left: 8px;
    color: ${color.Green};
`

const DeleteButton = styled.button.attrs({
    type: 'button',
    children: <TrashIcon />,
})`
    position: absolute;
    top: 12px;
    right: 8px;
    font-size: 14px;
    color: ${color.Gray};

    :hover {
        color: ${color.Red};
    }
`

const Text = styled.span`
    color: ${color.Black};
    font-size: 14px;
    line-height: 1.7;
    white-space: pre-wrap;
`

const Link = styled.a.attrs({
    target: '_blank',
    rel: 'noopener noreferrer',
})`
    color: ${color.Blue};
    font-size: 14px;
    line-height: 1.7;
    white-space: pre-wrap;
`

function DropArea({
    disabled,
    onDrop,
    children,
    className,
    style,
    }: {
        disabled?: boolean
        onDrop?(): void
        children?: React.ReactNode
        className?: string
        style?: React.CSSProperties
    }) {
        const [isTarget, setIsTarget] = useState(false)
        const visible = !disabled && isTarget
    
        const [dragOver, onDragOver] = useDragAutoLeave()
    
        return (
        <DropAreaContainer
            style={style}
            className={className}
            onDragOver={ev => {
            if (disabled) return
    
            ev.preventDefault()
            onDragOver(() => setIsTarget(false))
            }}
            onDragEnter={() => {
            if (disabled || dragOver.current) return
    
            setIsTarget(true)
            }}
            onDrop={() => {
                if (disabled) return
    
                setIsTarget(false)
                onDrop?.()
                }}
            >
                <DropAreaIndicator
                style={{
                    height: !visible ? 0 : undefined,
                    borderWidth: !visible ? 0 : undefined,
                }}
                />
        
                {children}
            </DropAreaContainer>
            )
        }
        
        /**
         * dragOver イベントが継続中かどうかのフラグを ref として返す
         *
         * timeout 経過後に自動でフラグが false になる
         *
         * @param timeout 自動でフラグを false にするまでの時間 (ms)
         */
        function useDragAutoLeave(timeout: number = 100) {
            const dragOver = useRef(false)
            const timer = useRef(0)
        
            return [
            dragOver,
        
            /**
             * @param onDragLeave フラグが false になるときに呼ぶコールバック
             */
            (onDragLeave?: () => void) => {
                clearTimeout(timer.current)
        
                dragOver.current = true
                timer.current = window.setTimeout(() => {
                    dragOver.current = false
                    onDragLeave?.()
                    }, timeout)
                },
                ] as const
            }
            
            const DropAreaContainer = styled.div`
                > :not(:first-child) {
                margin-top: 8px;
                }
            `
            
            const DropAreaIndicator = styled.div`
            height: 40px;
            border: dashed 3px ${color.Gray};
            border-radius: 6px;
            transition: all 50ms ease-out;
            `
        