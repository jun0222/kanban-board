import React, { useState } from 'react'
import styled from 'styled-components'
import * as color from './_color'
import { Card } from './Card'
import { PlusIcon } from './icon'
import { InputForm } from './InputForm'

export function Column({
    columns,
    setColumns,
    cid,
    title,
    cards,
    onCardDragStart,
    onCardDrop
}: {
    cid: string
    title?: string
    cards: {
        id: string
        text?: string
    }[]
    onCardDragStart?(id: string): void
    onCardDrop?(entered: string | null): void
}) {
    const totalCount = cards.length
    const [text, setText] = useState('')
    const [inputMode, setInputMode] = useState(false)
    const toggleInput = () => setInputMode(v => !v)
    const confirmInput = () => setText('')
    const cancelInput = () => setInputMode(false)

    
    const onClickDelete = (deleteCardId) => {
        const newColumns = [...columns];
        for (let i = 0; i < newColumns.length; i++) {
            for (let j = 0; j < newColumns[i].cards.length; j++) {
                if(newColumns[i].cards[j].id === deleteCardId){
                    newColumns[i].cards.splice(j, 1);
                }
            }
        }
        console.log(newColumns)
        setColumns(newColumns)
    };
    const [draggingCardID, setDraggingCardID] = useState<string | undefined>(
        undefined,
    )
    const handleCardDragStart = (id: string) => {
        setDraggingCardID(id)
        onCardDragStart?.(id)
    }

    return (
        <Container>
        <Header>
            <CountBadge>{totalCount}</CountBadge>
            <ColumnName>{title}</ColumnName>

            <AddButton onClick={toggleInput} />
        </Header>

        {inputMode && (
            <InputForm
                cid={cid}
                value={text}
                onChange={setText}
                onConfirm={confirmInput}
                onCancel={cancelInput}
            />
        )}

        <VerticalScroll>
        {cards.map(({ id, text }, i) => (
            <Card.DropArea
                key={id}
                disabled={
                    draggingCardID !== undefined &&
                    (id === draggingCardID || cards[i - 1]?.id === draggingCardID)
                }
                onDrop={() => onCardDrop?.(id)}
            >
                <Card
                    onClickDelete={onClickDelete}
                    id={id}
                    text={text}
                    onDragStart={() => handleCardDragStart(id)}
                    onDragEnd={() => setDraggingCardID(undefined)}
                />
            </Card.DropArea>
            ))}

            <Card.DropArea
                style={{ height: '100%' }}
                disabled={
                    draggingCardID !== undefined &&
                    cards[cards.length - 1]?.id === draggingCardID
                }
                onDrop={() => onCardDrop?.(null)}
            />
        </VerticalScroll>
        </Container>
    )
}

const Container = styled.div`
    display: flex;
    flex-flow: column;
    width: 355px;
    height: 100%;
    border: solid 1px ${color.Silver};
    border-radius: 6px;
    background-color: ${color.LightSilver};

    > :not(:last-child) {
        flex-shrink: 0;
    }
`

const Header = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 8px;
`

const CountBadge = styled.div`
    margin-right: 8px;
    border-radius: 20px;
    padding: 2px 6px;
    color: ${color.Black};
    background-color: ${color.Silver};
    font-size: 12px;
    line-height: 1;
`

const ColumnName = styled.div`
    color: ${color.Black};
    font-size: 14px;
    font-weight: bold;
`

const AddButton = styled.button.attrs({
    type: 'button',
    children: <PlusIcon />,
})`
    margin-left: auto;
    color: ${color.Black};

    :hover {
        color: ${color.Blue};
    }
`

const VerticalScroll = styled.div`
    height: 100%;
    padding: 8px;
    overflow-y: auto;
    flex: 1 1 auto;

    > :not(:first-child) {
        margin-top: 8px;
    }
`