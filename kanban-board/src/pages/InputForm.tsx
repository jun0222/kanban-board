import React, { useRef, useEffect } from 'react'
import styled from 'styled-components'
import * as color from './_color'
import { Button, ConfirmButton } from './Button'
import API, { graphqlOperation } from '@aws-amplify/api'
import { createCard, createOrder } from '../graphql/mutations'
import { listOrders } from '../graphql/queries'
import { randomID } from './_util'

export function InputForm({
    value,
    onChange,
    onConfirm,
    onCancel,
    className,
}: {
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

        const cardsOrder: any = await API.graphql(graphqlOperation(listOrders));

        // { item.id: item.next, item.id: item.next..... } 形式のオブジェクトを生成
        let cardsOrderShaped: any = {}
        let lastNext: any = ""
        cardsOrder.data.listOrders.items.forEach(item => {
            lastNext = item.next
            cardsOrderShaped[item.id] = item.next
        })
        console.log(lastNext)

        const text = ref.current.value;
        const card = {id: randomID,text: text};
        const order = {id: randomID, next: "next"}
        await API.graphql(graphqlOperation(createCard, { input: card }));
        await API.graphql(graphqlOperation(createOrder, { input: order }));
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
    
