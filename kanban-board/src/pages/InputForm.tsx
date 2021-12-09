import React, { useRef, useEffect } from 'react'
import styled from 'styled-components'
import * as color from './_color'
import { Button, ConfirmButton } from './Button'
import API, { graphqlOperation } from '@aws-amplify/api'
import { createCard, createOrder } from '../graphql/mutations'
import { listOrders, getOrder } from '../graphql/queries'
import { randomID } from './_util'

export function InputForm({
    onClickAdd,
    cid,
    value,
    onChange,
    onConfirm,
    onCancel,
    className,
}: {
    onClickAdd(cid: string, id: string, text: string): void
    cid: string
    value?: string
    onChange?(value: string): void
    onConfirm?(): void
    onCancel?(): void
    className?: string
}) {
    const disabled = !value?.trim()
    const handleConfirm = async () => {
        if (disabled) return
        onConfirm?.()

        const newCardID = randomID();

        // cardのレコード登録
        const text = ref.current.value;
        const card = {id: newCardID, text: text};
        await API.graphql(graphqlOperation(createCard, { input: card }));

        // cardのdom追加
        onClickAdd(cid, newCardID, text);

        // orderのレコード登録
        const columnHasCard: any = await API.graphql(graphqlOperation(getOrder, {id: cid}));
        if (columnHasCard.data.getOrder === null) {
            // まだレコードが無い場合
            const order = {id: cid, next: newCardID}
            API.graphql(graphqlOperation(createOrder, { input: order }))
        } else {
            // すでにレコードが有る場合
            const firstCardNext = columnHasCard.data.getOrder.next;
            const cardsOrder: any = await API.graphql(graphqlOperation(listOrders));
            let nextCard;
            let nextCardId = firstCardNext;

            for (let i = 1; i < cardsOrder.data.listOrders.items.length; i++) {
                nextCard = cardsOrder.data.listOrders.items.find((v) => v.id === nextCardId);
                if (nextCard !== undefined) {
                    nextCardId = nextCard.next;
                }
            }
            let existOrderLatestNext: any = nextCardId;
            const order = {id: existOrderLatestNext, next: newCardID};
            API.graphql(graphqlOperation(createOrder, { input: order }))
        }
    }
    const ref = useAutoFitToContentHeight(value)

    return (
        <Container className={className}>
        <Input
            ref={ref}
            autoFocus
            placeholder="Enter a note"
            value={value}
            onChange={ev => onChange?.(ev.currentTarget.value)}
            onKeyDown={ev => {
            if (!((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter')) return
            handleConfirm()
            }}
        />

        <ButtonRow>
            <AddButton disabled={disabled} onClick={handleConfirm} />
            <CancelButton onClick={onCancel} />
        </ButtonRow>
        </Container>
    )
}

const Container = styled.div``

const Input = styled.textarea`
    display: block;
    width: 100%;
    margin-bottom: 8px;
    border: solid 1px ${color.Silver};
    border-radius: 3px;
    padding: 6px 8px;
    background-color: ${color.White};
    font-size: 14px;
    line-height: 1.7;

    :focus {
        outline: none;
        border-color: ${color.Blue};
    }
`

const ButtonRow = styled.div`
    display: flex;

    > :not(:first-child) {
        margin-left: 8px;
    }
`

const AddButton = styled(ConfirmButton).attrs({
  children: 'Add',
})``

const CancelButton = styled(Button).attrs({
  children: 'Cancel',
})``


/**
  * テキストエリアの高さを内容に合わせて自動調整する
  *
  * @param content テキストエリアの内容
  */
function useAutoFitToContentHeight(content: string | undefined) {
    const ref = useRef<HTMLTextAreaElement>(null)
    
    useEffect(
        () => {
        const el = ref.current
        if (!el) return
    
        const { borderTopWidth, borderBottomWidth } = getComputedStyle(el)
        el.style.height = 'auto' // 一度 auto にしないと高さが縮まなくなる
        el.style.height = `calc(${borderTopWidth} + ${el.scrollHeight}px + ${borderBottomWidth})`
        },
        // 内容が変わるたびに高さを再計算
        [content],
    )
    
    return ref
    }
    
