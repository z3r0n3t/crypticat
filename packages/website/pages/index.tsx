import { useState, useEffect, useRef } from 'react'
import { CrypticatClient } from '@crypticat/core'
import createUid from 'uid-promise'

import AtIcon from '@crypticat/ionicons/lib/at-outline'
import EnterIcon from '@crypticat/ionicons/lib/enter-outline'

import Box from '../components/box'
import Text from '../components/text'
import Input from '../components/input'
import Button from '../components/button'
import ChatInput from '../components/chat-input'
import IconButton from '../components/icon-button'

import NickModal from '../modals/nick'
import RoomModal from '../modals/room'

export default () => {
  const [address, setAddress] = useState('wss://2b70a277.ngrok.io')
  const [client, setClient] = useState<CrypticatClient | null>(null)
  const [connecting, setConnecting] = useState(false)

  const [nick, setNick] = useState<string | null>(null)
  const [room, setRoom] = useState('lobby')
  const [messages, setMessages] = useState<{ from: string, content: string, mid: string }[]>([])

  const [showNickModal, setShowNickModal] = useState(false)
  const [showRoomModal, setShowRoomModal] = useState(false)

  const scrollBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!client) return
    setRoom('lobby')

    client.on('message', async (from, content) => {
      const mid = await createUid(8)
      setMessages((messages) => messages.concat([{ from, content, mid }]))
      scrollBottomRef.current?.scrollIntoView()
    })

    client.on('disconnect', () => setClient(null))

    return () => { client.removeAllListeners() }
  }, [client])

  const joinRoom = async (newRoom: string, thisClient: CrypticatClient | null = client) => {
    setMessages([])
    if (!thisClient) return setRoom('lobby')
    if (newRoom.startsWith('#')) newRoom = newRoom.slice(1)
    await thisClient.joinRoom(newRoom)
    setRoom(newRoom)
  }

  if (!client) {
    return (
      <Box flex direction='column' fullHeight>
        <Box $='header' flex background='header' px={24} py={16}>
          <Text $='h1' weight={700} color='heading-primary' mr={8} noInteraction>
            crypticat
          </Text>
          <Text color='heading-secondary' noInteraction>
            dead simple secure chat
          </Text>
        </Box>

        <Box flex direction='column' expand background='chat' align='center' justify='center' p={24}>
          <Text size='lg' weight={700} color='heading-primary' centered mb={16} noInteraction>
            Connect to a server
          </Text>

          <Text color='heading-secondary' centered noInteraction>
            Get started by choosing a server to connect to. This will be saved when you visit the site in the future.
          </Text>

          <Box flex fullWidth justify='center' mt={32}>
            <Input placeholder='WebSocket address' value={address} onChange={setAddress} mr={16} />
            <Button onClick={async () => {
              if (connecting) return
              const newClient = new CrypticatClient()
              setConnecting(true)

              await newClient.connect(address)
              await joinRoom('lobby', newClient)

              setConnecting(false)
              setClient(newClient)
              setShowNickModal(true)
            }} disabled={!address || connecting}>Connect</Button>
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box flex direction='column' fullHeight>
      <NickModal
        show={showNickModal}
        close={() => setShowNickModal(false)}
        setNick={setNick}
      />
      <RoomModal
        show={showRoomModal}
        close={() => setShowRoomModal(false)}
        setRoom={joinRoom}
      />

      <Box $='header' flex background='header' align='center' px={24}>
        <Text size={1.375} color='text-muted' mr={8} noInteraction>
          #
        </Text>

        <Box py={16} expand>
          <Text color='heading-primary' weight={700} noInteraction>
            {room}
          </Text>
        </Box>

        <Box flex>
          <IconButton icon={EnterIcon} onClick={() => setShowRoomModal(true)} mr={8} />
          <IconButton icon={AtIcon} onClick={() => setShowNickModal(true)} />
        </Box>
      </Box>

      <Box $='main' flex direction='column' expand background='chat' px={24} py={16} scrollfix>
        <Box mb={54} expand='1 1 auto' flex justify='flex-end' direction='column'>
          <Text size='lg' weight={700} color='heading-primary' mb={16} noInteraction>
            Welcome to #{room}
          </Text>

          <Text color='heading-secondary' noInteraction>
            All of your messages are encrypted to the highest standards, and nothing is stored.
          </Text>
        </Box>

        {messages.map(({ from, content, mid }) => (
          <Box mb={16} key={mid}>
            <Text weight={500} color='heading-primary' mb={6}>{from}</Text>
            <Text color='text-normal'>{content}</Text>
          </Box>
        ))}

        <div aria-hidden ref={scrollBottomRef} />
      </Box>

      <ChatInput room={room} onSend={async (content) => {
        client.sendMessage(nick ?? 'unnicked', content)
        setMessages(messages.concat([{
          from: nick ?? 'unnicked',
          content,
          mid: await createUid(8)
        }]))
        scrollBottomRef.current?.scrollIntoView()
      }} />
    </Box>
  )
}