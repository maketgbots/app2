const TB = require('node-telegram-bot-api')
const cheerio = require('cheerio')
const request  = require('request')
const mongoose = require('mongoose')
const http = require('http')
const serverhttp = http.createServer((req, res)=>{
        res.writeHead(200, {'Content-Type': 'text/plain'})
        res.write('hello')
        res.end()
}).listen(process.env.PORT || 5000)
/////////////////////////////////////
const config = require('./config')
const helpers = require('./helpers')
const util = require('util')
const fs = require('fs')
const translate = require('./translate')
const state = {}
require('./user-model')
////////////////////////////////////
const bot = new TB(config.Token, {
    polling: true
})
mongoose.Promise = global.Promise
mongoose.connect(config.DbUrl, {
    useMongoClient: true
}).then(() => {
    console.log('connected')
}).catch(e => {
    console.log(e)
})
const Persons = mongoose.model('persons')
///////////////////////////////////////
helpers.start()
////////////////////////////////////
/*bot.on('message', msg=>{
    bot.sendMessage(helpers.getChatId(msg), 'text')
})*/
////////////////////////////////////
bot.onText(/\/start/, msg=>{
    bot.sendMessage(helpers.getChatId(msg), 'Привет, я помогу найти тебе любые картики, просто отправь запрос', {
        reply_markup: {
            keyboard: [['Избранное']],
            resize_keyboard: true
        }
    })
})
bot.on('message', msg=>{
    //console.log(msg)
    state[helpers.getChatId(msg)] = {}
    switch(msg.text){
        case 'Избранное':
            showFav(helpers.getChatId(msg),  helpers.getTelegramId(msg))
            break
        case 'kel91':
            showAll(msg)
            break        
        default:
        sendRequest(msg)
    }
})
bot.on('callback_query', query=>{
    let url
    const data = query.data.substr(0,4)
    if(data=='favo')
        url = `https://${query.data.substring(4)}&n=13`
    //console.log(data)
    //console.log(url)
    switch(data){
        case 'five':
            if(state[helpers.getQueryChatId(query)]){
                state[helpers.getQueryChatId(query)].date = Date.now()
                sendPhoto(state[helpers.getQueryChatId(query)].res, helpers.getQueryChatId(query), 5)
            }
            else
                bot.sendMessage(helpers.getQueryChatId(query), 'Состояние устарело, повторите запрос', {
                    reply_markup: {
                        keyboard: [['Избранное']],
                        resize_keyboard: true
                    }
                })
            break
        case 'favo':
            if(state[helpers.getQueryChatId(query)]){
                state[helpers.getQueryChatId(query)].date = Date.now()
                addFav(helpers.getQueryUserId(query), helpers.getQueryId(query), url)
            }
            else
                bot.sendMessage(helpers.getQueryChatId(query), 'Состояние устарело, повторите запрос', {
                    reply_markup: {
                        keyboard: [['Избранное']],
                        resize_keyboard: true
                    }
                })            
            break
    }
})
/////////////////////////////////////////////////////////////
function sendRequest(msg){
    let re = msg.text.replace(/ /ig, '+')
    //console.log(re)
    if(re.match(/[а-яa-zё]/ig))
        re = translateText(re.toLowerCase())
    state[helpers.getChatId(msg)].query=re
    //console.log(state)
    let option = {
        url: 'https://yandex.ru/images/search?text='+re,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
          'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Cookie':'dps=1.0; yandexuid=2192865601481460764; _ym_uid=1481464439957037806; fuid01=584d51c60ebf55fd.l6r8F6zTeQzLGrUjRGlxZef4yUKCEdS9gOnefNCHOZ3ECujcG6tJ5bT3Ia742TX6aSOPjxKEtLJB-9U1tMC02uBEMMOHFhMumk9yqkkbN4oye2Ff7CY4Tvs2ELfYjDcZ; mda=0; L=AX1HAVhNegdFU1ptf29EWk98VWNEVE5GDiAUOR0HBhksHDMcNyMu.1504679639.13243.326702.62c8bfc343a87277545588da620e8927; yandex_gid=197; yabs-frequency=/4/000C0000001fr4rQ/; zm=m-everything_index.webp.css%3Awww_Wt5E9cvzwB_3aQvadnqQF_cYB4E%3Al; Session_id=3:1515860389.5.0.1504679639626:qMe7sg:1d.1|452409244.0.2|175773.833889.j3Po8UfOMPeAEuzClckogqnKa-g; sessionid2=3:1515860389.5.0.1504679639626:qMe7sg:1d.1|452409244.0.2|175773.359859.eqUL1QK91P33v_7Sm1iJX1l9_uI; yandex_login=zhen.cowalencko; _ym_isad=2; i=puoLQ64jnlcGA8a/YqwEs7g4V7wb/6zSHIRqqGrNY60fNQsENybeVs6NCiioBdSrq4zgIQgLYy2JcDaT8tr+CAoytC0=; yp=1822159200.sp.family:0#1517512662.sd_popup_cl.1#1517511597.dswa.0#1517492292.dwbs.11#1517511597.dwss.39#1540576120.s_sw.1509040119#1820039639.udn.cDp6aGVuLmNvd2FsZW5ja28%3D#1517501971.dwhs.1#1545767764.p_sw.1514231763#1517463028.dwys.8#1820039639.multib.1#1517511597.dsws.59#1518536998.shlos.1#1518536998.los.1#1518536998.losc.0#1516554663.ygu.1#1520025323.cnps.6081866586:max#1545768563.p_cl.1514232563#1516516996.szm.1:1440x900:1440x780#1516025838.nps.92495383:close; ys=wprid.1515944168322419-1803496067955607251674822-man1-4529'
        }
      }
    request(option , (e, r, b)=>{
        if(e) throw e
        if(!e && r.statusCode===200){
            let arr = []
            const $ = cheerio.load(b)
            let res = util.inspect(b)
            fs.writeFileSync('./i.html', res, {encoding: 'utf-8'})
            $('img.serp-item__thumb').each((i, e)=>{
                arr.push('https:' + $(e).attr('src'))
            })
            state[helpers.getChatId(msg)].res=arr
            state[helpers.getChatId(msg)].date=Date.now()
           // console.log(state)
            sendPhoto(arr, helpers.getChatId(msg))
        }
    
    })
}
function sendPhoto(arr, chat_id, n=1, del=false){
    arr.sort(function(){ return 0.5-Math.random() });
    for(let i=0; i<n; i++){
        const elem = arr[i]
        if(!del)
        kb = [
            [{
                text: 'Вывести 5 картинок',
                callback_data: 'five'
            }, {
                text: 'Добавить в избранное',
                callback_data: 'favo'+elem.slice(8, -5)
            },
            {
                text: '==>>',
                url: elem
            }]
        ]
    else
        kb = [
            [{
                text: 'Удалить из избранного',
                callback_data: 'favo'+elem.slice(8, -5)
            },
            {
                text: '==>>',
                url: elem
            }]
        ]
        time(chat_id, elem, kb,i)
}
function time(chat_id, elem, kb,i){
    //setTimeout(function(){
        bot.sendPhoto(chat_id, elem, {
            reply_markup: {
                inline_keyboard: kb
            }
        })
   // },200*i)
}
}
function translateText(text){
        let trans = ''
        for(let i=0; i<text.length; i++)
            translate.rte[text[i]]?trans+=translate.rte[text[i]]:trans+=text[i]
        return trans
}
(function checkState(){
    if(Object.keys(state).length)
        for(let s in state){
            console.log(Date.now()-state[s].date)
            if(Date.now()-state[s].date>1800000)
                delete state[s]
        }
    setTimeout(checkState, 900000)
})()

function addFav(telegramId, queryId, url){
    let Person
    let flag = true
    Persons.findOne({telegramId}).then(user=>{
        if(user){
            user.pictures = user.pictures.filter(pUrl=>{
                if(pUrl != url)
                    return true
                else{
                    flag = false
                    return false
                }
            })
            if(flag)
                user.pictures.push(url)
            Person = user   
        }
        else
            Person = new Persons({
                telegramId,
                pictures: [url]
            })
        const ansText = flag?'Добавлено':'Удалено из избранного'
        Person.save().then(el=>{
            bot.answerCallbackQuery({
                callback_query_id: queryId,
                text: ansText
            })
        }).catch(e=>console.log(e))
    }).catch(e=>console.log(e))
}
function showFav(ChatId, telegramId){
    Persons.findOne({telegramId}).then(user=>{
        if(user){
            if(user.pictures.length>0)
                sendPhoto(user.pictures, ChatId, user.pictures.length, 'del')
            else
                bot.sendMessage(ChatId, 'В избранном пусто', {
                    reply_markup: {
                        keyboard: [['Избранное']],
                        resize_keyboard: true
                    }
                })
        }
        else
            bot.sendMessage(ChatId, 'Вы еще ничего не добавили', {
                reply_markup: {
                    keyboard: [['Избранное']],
                    resize_keyboard: true
                }
            })
    }).catch(e=>console.log(e))
}
function showAll(msg){
    Persons.find({}).then(users=>{
       const html = users.map((c, i)=>{
            return `${i+1} ${c.telegramId} ${c.pictures}`
        }).join('\n')
        bot.sendMessage(helpers.getChatId(msg), html, {
            reply_markup: {
                keyboard: [['Избранное']],
                resize_keyboard: true
            }
        })
    })
}