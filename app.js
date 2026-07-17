const express = require('express')
const cors = require('cors')
const tcb = require('@cloudbase/node-sdk')

const app = express()
const PORT = process.env.PORT || 8080

// 全局跨域
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}))

// 初始化云开发
tcb.init({
  env: process.env.TCB_ENV_ID
})
const db = tcb.database()

// ========== 讣告保存/新增接口 ==========
app.post('/api/obituary/save', async (req,res)=>{
  try{
    let {id,name,gender,birth,death,content,lingtangAddr,farewellTime,farewellAddr,thankyouTime,thankyouAddr,tombAddr,avatar,lifePhotos} = req.body

    let data = {
      name,gender,birth,death,content,
      lingtangAddr:lingtangAddr||"",
      farewellTime:farewellTime||"",
      farewellAddr:farewellAddr||"",
      thankyouTime:thankyouTime||"",
      thankyouAddr:thankyouAddr||"",
      tombAddr:tombAddr||"",
      avatar,
      lifePhotos: JSON.parse(lifePhotos||"[]"),
      createTime: new Date()
    }

    if(id){
      await db.collection("obituary").doc(id).update(data)
    }else{
      await db.collection("obituary").add(data)
    }

    res.json({code:200,msg:"success"})
  }catch(e){
    res.json({code:500,msg:e.message})
  }
})

// ========== 获取单条讣告 ==========
app.get('/api/obituary/get',async (req,res)=>{
  let id = req.query.id
  let {data} = await db.collection("obituary").doc(id).get()
  res.json({code:200,data})
})

// ========== 点灯查询 ==========
app.get('/api/light/info',async (req,res)=>{
  let {obitName,ip} = req.query
  let totalRes = await db.collection("light").where({obitName}).count()
  let userRes = await db.collection("light").where({obitName,ip}).get()

  res.json({
    code:200,
    total: totalRes.total,
    hasLight: userRes.data.length>0
  })
})

// ========== 点灯新增 ==========
app.post('/api/light/add',async (req,res)=>{
  let {obitName,ip} = req.body
  let chk = await db.collection("light").where({obitName,ip}).get()
  if(chk.data.length>0) return res.json({code:400,msg:"已点过灯"})

  await db.collection("light").add({obitName,ip,time:new Date()})
  res.json({code:200})
})

// ========== 留言列表 ==========
app.get('/api/msg/list',async (req,res)=>{
  let list = await db.collection("message").where({obitName:req.query.obitName}).orderBy("time","desc").get()
  res.json({code:200,data:list.data})
})

// ========== 留言新增 ==========
app.post('/api/msg/add',async (req,res)=>{
  let {obitName,name,content} = req.body
  await db.collection("message").add({
    obitName,name,content,time:new Date()
  })
  res.json({code:200})
})

app.listen(PORT,()=>{
  console.log("Server run on "+PORT)
})
