const express = require('express')
const cors = require('cors')
const tcb = require('@cloudbase/node-sdk')

const app = express()
const PORT = process.env.PORT || 8080

// 全局跨域
app.use(cors())
// 兼容微信OPTIONS预检
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204)
  next()
})

app.use(express.json())
app.use(express.urlencoded({extended:true}))

// 云开发初始化
const tcbApp = tcb.init({
  env: process.env.TCB_ENV_ID,
  secretId: process.env.TCB_SECRET_ID,
  secretKey: process.env.TCB_SECRET_KEY
})
const db = tcbApp.database()

// ========== 讣告保存/新增接口（修复丢失ownerUid问题） ==========
app.post('/api/obituary/save', async (req,res)=>{
  try{
    let {id,name,gender,birth,death,content,lingtangAddr,farewellTime,farewellAddr,thankyouTime,thankyouAddr,tombAddr,avatar,lifePhotos,ownerUid} = req.body

    let data = {
      name,
      gender: gender || "",
      birth: birth || "",
      death: death || "",
      content: content || "",
      lingtangAddr:lingtangAddr||"",
      farewellTime:farewellTime||"",
      farewellAddr:farewellAddr||"",
      thankyouTime:thankyouTime||"",
      thankyouAddr:thankyouAddr||"",
      tombAddr: tombAddr || "",
      avatar: avatar || "",
      lifePhotos: Array.isArray(lifePhotos) 
        ? lifePhotos 
        : (lifePhotos ? JSON.parse(lifePhotos) : []),
      createTime: new Date(),
      ownerUid
    }

    if(id){
      // 修复：不再删除ownerUid，旧数据归属永久保留
      await db.collection("obituary").doc(id).update(data)
    }else{
      await db.collection("obituary").add(data)
    }

    res.json({code:200,msg:"success"})
  }catch(e){
    console.error("保存讣告异常：", e)
    res.json({code:500,msg:e.message})
  }
})

// ========== 获取单条讣告 ==========
app.get('/api/obituary/get',async (req,res)=>{
  try{
    let id = req.query.id
    if(!id) return res.json({code:400,msg:"缺少讣告id参数"})
    let {data} = await db.collection("obituary").doc(id).get()
    res.json({code:200,data})
  }catch(e){
    console.error("查询单条讣告异常：", e)
    res.json({code:500,msg:e.message})
  }
})

// ========== 讣告列表接口（uid过滤本人数据，完全匹配前端） ==========
app.get('/api/obituary/list',async (req,res)=>{
  try{
    const uid = req.query.uid;
    let query = db.collection("obituary").orderBy("createTime","desc");
    if(uid){
      query = query.where({ownerUid:uid})
    }
    let list = await query.get()
    res.json({code:200,data:list.data})
  }catch(e){
    console.error("查询讣告列表异常：", e)
    res.json({code:500,msg:e.message})
  }
})

// ========== 删除讣告（修复length报错，兼容无uid旧讣告） ==========
app.post('/api/obituary/delete',async (req,res)=>{
  try{
    let {id,uid} = req.body
    if(!id || !uid) return res.json({code:400,msg:"参数缺失"})
    const {data} = await db.collection("obituary").doc(id).get();
    // 修复：doc查询返回单对象，无length属性
    if(!data){
      return res.json({code:404,msg:"讣告不存在"})
    }
    // 兼容早期无ownerUid的旧讣告，直接允许删除
    if(data.ownerUid && data.ownerUid !== uid){
      return res.json({code:403,msg:"无权限删除他人讣告"})
    }
    await db.collection("obituary").doc(id).remove()
    res.json({code:200,msg:"删除成功"})
  }catch(e){
    console.error("删除讣告异常：", e)
    res.json({code:500,msg:e.message})
  }
})

// ========== 点灯查询 ==========
app.get('/api/light/info',async (req,res)=>{
  try{
    let {obitName,ip} = req.query
    if(!obitName) return res.json({code:400,msg:"缺少逝者名称参数"})
    let totalRes = await db.collection("light").where({obitName}).count()
    let userRes = await db.collection("light").where({obitName,ip}).get()

    res.json({
      code:200,
      total: totalRes.total,
      hasLight: userRes.data.length>0
    })
  }catch(e){
    console.error("查询点灯数据异常：", e)
    res.json({code:500,msg:e.message})
  }
})

// ========== 点灯新增 ==========
app.post('/api/light/add',async (req,res)=>{
  try{
    let {obitName,ip} = req.body
    if(!obitName || !ip) return res.json({code:400,msg:"参数缺失"})
    let chk = await db.collection("light").where({obitName,ip}).get()
    if(chk.data.length>0) return res.json({code:400,msg:"已点过灯"})

    await db.collection("light").add({obitName,ip,time:new Date()})
    res.json({code:200})
  }catch(e){
    console.error("新增点灯记录异常：", e)
    res.json({code:500,msg:e.message})
  }
})

// ========== 留言列表 ==========
app.get('/api/msg/list',async (req,res)=>{
  try{
    let obitName = req.query.obitName
    if(!obitName) return res.json({code:400,msg:"缺少逝者名称参数"})
    let list = await db.collection("message").where({obitName}).orderBy("time","desc").get()
    res.json({code:200,data:list.data})
  }catch(e){
    console.error("查询留言异常：", e)
    res.json({code:500,msg:e.message})
  }
})

// ========== 留言新增 ==========
app.post('/api/msg/add',async (req,res)=>{
  try{
    let {obitName,name,content} = req.body
    if(!obitName || !name || !content) return res.json({code:400,msg:"参数不全"})
    await db.collection("message").add({
      obitName,name,content,time:new Date()
    })
    res.json({code:200})
  }catch(e){
    console.error("新增留言异常：", e)
    res.json({code:500,msg:e.message})
  }
})

// ========== 用户评价接口 ==========
// 获取评价列表
app.get('/api/review/list',async (req,res)=>{
  try{
    let list = await db.collection("review").orderBy("time","desc").get()
    res.json({code:200,data:list.data})
  }catch(e){
    console.error("查询评价异常：", e)
    res.json({code:500,msg:"加载评价失败"})
  }
})

// 提交新评价
app.post('/api/review/add',async (req,res)=>{
  try{
    const {name,content} = req.body
    if(!name || !content) return res.json({code:400,msg:"姓名和评价内容不能为空"})
    await db.collection("review").add({
      name,
      content,
      time: new Date()
    })
    res.json({code:200,msg:"评价提交成功"})
  }catch(e){
    console.error("新增评价异常：", e)
    res.json({code:500,msg:"提交评价失败"})
  }
})

app.listen(PORT,()=>{
  console.log("Server run on "+PORT)
})