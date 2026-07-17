{\rtf1\ansi\ansicpg936\cocoartf2870
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fnil\fcharset0 HelveticaNeue;}
{\colortbl;\red255\green255\blue255;\red24\green26\blue31;\red255\green255\blue255;}
{\*\expandedcolortbl;;\cssrgb\c12157\c13725\c16078;\cssrgb\c100000\c100000\c100000;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab720
\pard\pardeftab720\partightenfactor0

\f0\fs32 \cf2 \cb3 \expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 const express = require('express')\
const cors = require('cors')\
const multer = require('multer')\
const path = require('path')\
const \{ cloudbase \} = require('cloudbase-admin')\
\
// \uc0\u21021 \u22987 \u21270 \u20113 \u24320 \u21457 \
cloudbase.init()\
const db = cloudbase.database()\
\
const app = express()\
const port = process.env.PORT || 80\
\
// \uc0\u20840 \u23616 \u20013 \u38388 \u20214 \
app.use(cors())\
app.use(express.json())\
app.use(express.urlencoded(\{ extended: true \}))\
app.use(express.static(path.join(__dirname, 'public')))\
\
// \uc0\u25991 \u20214 \u19978 \u20256 \u20869 \u23384 \u27169 \u24335 \
const upload = multer(\{ storage: multer.memoryStorage() \})\
\
// ====================== \uc0\u35747 \u21578 \u26680 \u24515 \u25509 \u21475 \u65288 \u20462 \u22797 \u21333 \u26465 /\u21015 \u34920 /\u26032 \u22686 /\u32534 \u36753 /\u21024 \u38500 \u65289  ======================\
/**\
 * 1. \uc0\u33719 \u21462 \u35747 \u21578 \u21015 \u34920 \u65288 \u31649 \u29702 \u39029 \u29992 \u65289 \
 */\
app.get('/api/obituary/list', async (req, res) => \{\
  try \{\
    const result = await db.collection('obituary').orderBy('updateTime', 'desc').get()\
    res.json(\{\
      code: 200,\
      data: result.data\
    \})\
  \} catch (err) \{\
    res.json(\{ code: 500, msg: '\uc0\u33719 \u21462 \u21015 \u34920 \u22833 \u36133 ', err: err.message \})\
  \}\
\})\
\
/**\
 * 2. \uc0\u33719 \u21462 \u21333 \u26465 \u35747 \u21578 \u65288 \u32534 \u36753 \u39029 \u12289 \u35814 \u24773 \u39029 \u20849 \u29992 \u65292 \u20256 id\u20026 \u32534 \u36753 /\u26597 \u30475 \u65292 \u19981 \u20256 \u36820 \u22238 \u31532 \u19968 \u26465 \u65289 \
 */\
app.get('/api/obituary/get', async (req, res) => \{\
  try \{\
    const \{ id \} = req.query\
    let data = null\
    if (id) \{\
      // \uc0\u26681 \u25454 id\u26597 \u35810 \u21333 \u26465 \
      const result = await db.collection('obituary').doc(id).get()\
      data = result.data\
    \} else \{\
      // \uc0\u26080 id\u21462 \u31532 \u19968 \u26465 \u65288 \u20860 \u23481 \u26087 \u36923 \u36753 \u65289 \
      const result = await db.collection('obituary').limit(1).get()\
      data = result.data.length > 0 ? result.data[0] : null\
    \}\
    res.json(\{ code: 200, data \})\
  \} catch (err) \{\
    res.json(\{ code: 500, msg: '\uc0\u33719 \u21462 \u35747 \u21578 \u22833 \u36133 ', err: err.message \})\
  \}\
\})\
\
/**\
 * 3. \uc0\u20445 \u23384 /\u26356 \u26032 \u35747 \u21578 \u65288 \u26032 \u24314 /\u32534 \u36753 \u21512 \u19968 \u65292 \u24102 id\u20026 \u26356 \u26032 \u65292 \u26080 id\u26032 \u22686 \u65289 \
 */\
app.post('/api/obituary/save', upload.any(), async (req, res) => \{\
  try \{\
    const body = req.body\
    const saveData = \{\
      name: body.name || '',\
      gender: body.gender || '',\
      birth: body.birth || '',\
      death: body.death || '',\
      content: body.content || '',\
      lingtangAddr: body.lingtangAddr || '',\
      farewellTime: body.farewellTime || '',\
      farewellAddr: body.farewellAddr || '',\
      thankyouTime: body.thankyouTime || '',\
      thankyouAddr: body.thankyouAddr || '',\
      tombAddr: body.tombAddr || '',\
      avatar: body.avatar || '',\
      lifePhotos: JSON.parse(body.lifePhotos || '[]'),\
      createTime: new Date().toLocaleString(),\
      updateTime: new Date().toLocaleString()\
    \}\
\
    // \uc0\u32534 \u36753 \u27169 \u24335 \u65306 \u23384 \u22312 id\u21017 \u26356 \u26032 \u65292 \u20445 \u30041 \u21407 \u22987 \u21019 \u24314 \u26102 \u38388 \
    if (body.id) \{\
      const oldDoc = await db.collection('obituary').doc(body.id).get()\
      if (oldDoc.data?.createTime) saveData.createTime = oldDoc.data.createTime\
      await db.collection('obituary').doc(body.id).update(saveData)\
    \} else \{\
      // \uc0\u26032 \u24314 \
      await db.collection('obituary').add(saveData)\
    \}\
    res.json(\{ code: 200, msg: '\uc0\u20445 \u23384 \u25104 \u21151 ' \})\
  \} catch (err) \{\
    res.json(\{ code: 500, msg: '\uc0\u20445 \u23384 \u22833 \u36133 ', err: err.message \})\
  \}\
\})\
\
/**\
 * 4. \uc0\u21024 \u38500 \u35747 \u21578 \u65288 \u26681 \u25454 id\u21024 \u38500 \u65289 \
 */\
app.post('/api/obituary/delete', async (req, res) => \{\
  try \{\
    const \{ id \} = req.body\
    await db.collection('obituary').doc(id).remove()\
    res.json(\{ code: 200, msg: '\uc0\u21024 \u38500 \u25104 \u21151 ' \})\
  \} catch (err) \{\
    res.json(\{ code: 500, msg: '\uc0\u21024 \u38500 \u22833 \u36133 ', err: err.message \})\
  \}\
\})\
\
// ====================== \uc0\u30041 \u35328 \u25509 \u21475  ======================\
// \uc0\u26032 \u22686 \u30041 \u35328 \
app.post('/api/msg/add', async (req, res) => \{\
  try \{\
    const \{ obitName, name, content \} = req.body\
    await db.collection('obituary_msg').add(\{\
      obitName,\
      name,\
      content,\
      time: new Date().toLocaleString()\
    \})\
    res.json(\{ code: 200, msg: '\uc0\u30041 \u35328 \u25104 \u21151 ' \})\
  \} catch (err) \{\
    res.json(\{ code: 500, msg: '\uc0\u30041 \u35328 \u22833 \u36133 ' \})\
  \}\
\})\
\
// \uc0\u33719 \u21462 \u30041 \u35328 \u21015 \u34920 \
app.get('/api/msg/list', async (req, res) => \{\
  try \{\
    const \{ obitName \} = req.query\
    const list = await db.collection('obituary_msg')\
      .where(\{ obitName \})\
      .orderBy('time', 'desc')\
      .get()\
    res.json(\{ code: 200, data: list.data \})\
  \} catch (err) \{\
    res.json(\{ code: 500, msg: '\uc0\u21152 \u36733 \u30041 \u35328 \u22833 \u36133 ' \})\
  \}\
\})\
\
// ====================== \uc0\u28857 \u28783 \u25509 \u21475  ======================\
// \uc0\u29992 \u25143 \u28857 \u28783 \u25552 \u20132 \
app.post('/api/light/add', async (req, res) => \{\
  try \{\
    const \{ obitName, ip \} = req.body\
    // \uc0\u21028 \u26029 \u26159 \u21542 \u24050 \u28857 \u28783 \
    const exist = await db.collection('obituary_light')\
      .where(\{ obitName, ip \})\
      .get()\
    if (exist.data.length > 0) \{\
      return res.json(\{ code: 400, msg: '\uc0\u24744 \u24050 \u28857 \u36807 \u28783 \u65292 \u19981 \u21487 \u37325 \u22797 \u28857 \u20142 ' \})\
    \}\
    await db.collection('obituary_light').add(\{\
      obitName,\
      ip,\
      lightTime: new Date().toLocaleString()\
    \})\
    // \uc0\u32479 \u35745 \u24635 \u28857 \u28783 \u25968 \u37327 \
    const countRes = await db.collection('obituary_light').where(\{ obitName \}).count()\
    res.json(\{ code: 200, msg: '\uc0\u28857 \u28783 \u31048 \u31119 \u25104 \u21151 ', total: countRes.total \})\
  \} catch (err) \{\
    res.json(\{ code: 500, msg: '\uc0\u28857 \u28783 \u22833 \u36133 ' \})\
  \}\
\})\
\
// \uc0\u33719 \u21462 \u28857 \u28783 \u24635 \u25968 \u12289 \u24403 \u21069 \u29992 \u25143 \u26159 \u21542 \u28857 \u28783 \
app.get('/api/light/info', async (req, res) => \{\
  try \{\
    const \{ obitName, ip \} = req.query\
    const totalRes = await db.collection('obituary_light').where(\{ obitName \}).count()\
    const userLight = await db.collection('obituary_light').where(\{ obitName, ip \}).get()\
    res.json(\{\
      code: 200,\
      total: totalRes.total,\
      hasLight: userLight.data.length > 0\
    \})\
  \} catch (err) \{\
    res.json(\{ code: 500, msg: '\uc0\u33719 \u21462 \u28857 \u28783 \u25968 \u25454 \u22833 \u36133 ' \})\
  \}\
\})\
\
app.listen(port, () => \{\
  console.log(`\uc0\u35747 \u21578 \u26381 \u21153 \u21551 \u21160 \u25104 \u21151 \u65292 \u31471 \u21475 \u65306 $\{port\}`)\
\})}