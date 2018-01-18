module.exports = {
    start(){
        console.log('bot was started')
    },
    getChatId(msg){
        return msg.chat.id
    },
    getQueryUserId(query){
        return query.from.id
    },
    getQueryChatId(query){
        return query.message.chat.id
    },
    getQueryId(query){
        return query.id
    },
    getTelegramId(msg){
        return msg.from.id
    }

}