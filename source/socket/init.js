//Core
import io from 'socket.io-client';

export const socket = io('https://lab.lectrum',{
    path: '/react/ws',
});