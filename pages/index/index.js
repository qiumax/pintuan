const app = getApp()
var util = require('../../utils/util.js');
var handlogin = require('../../utils/handlelogin.js');
Page({
  data: {
    userInfo: getApp().globalData.userInfo,
    config:'',
    toppic:'',
    detail:'',
    showdetail:1,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    host: getApp().globalData.host,
    product:[],
    hasUserInfo:true,
    hasphone:false,//是否有电话信息
    activitystatus:1, //
    interval:'',
    starttime:'',//开始时间
    ping:[],
    share_userid: '',//分销用户id
    hasping:'',//判断当前是否有拼团
    expire:0//带链接拼团id的过期时间
  },


  gotoHome:function(){
    wx.switchTab({
      url: '../member/index'
    })
  },

  getPhoneNumber: function (e) {
    var _this =this
    //先判断用户是否已经有电话
    var btn_type = e.currentTarget.dataset.type
    var pt_id = e.currentTarget.dataset.pt_id

    console.log(e)
    console.log(e.detail.errMsg)
    console.log(e.detail.iv)
    console.log(e.detail.encryptedData)
    if (e.detail.errMsg == 'getPhoneNumber:fail user deny') {
      wx.showToast({
        title: '授权失败，请重试',
        icon:'none',
        duration:2000
      })
    } else {//授权成功

      //解密数据
      handlogin.isLogin(() => {
        wx.request({
          url: 'https://ping.quxunbao.cn/api/user/getphone',
          data: {
            'user_id': wx.getStorageSync('user_id'),
            's_id': wx.getStorageSync('s_id'),
            'encryptedData': e.detail.encryptedData,
            'iv': e.detail.iv,
            'session_key': wx.getStorageSync('session_key')
          },
          method: 'POST',
          header: {
            'content-type': 'application/json'
          }, // 设置请求的 header
          success: function (res) {
              console.log(res)
              if(res.data.phoneNumber){
                  //更新
                wx.request({
                  url: 'https://ping.quxunbao.cn/api/user/updateInfo',
                  data: {
                    'user_id': wx.getStorageSync('user_id'),
                    's_id': wx.getStorageSync('s_id'),
                    'phone': res.data.phoneNumber,
                    'name': wx.getStorageSync('name'),
                  },
                  method: 'POST',
                  header: {
                    'content-type': 'application/json'
                  }, // 设置请求的 header
                  success: function (res) {
                      console.log('update success')
                  }

                })
              }
             
          },
          complete:function(res){//进入相应页面
            if (btn_type == 'member')
            {
              wx.switchTab({
                url: '../member/index'
              })
            }
            else
            {
              if (_this.data.hasping) {
                wx.navigateTo({
                  url: '../order_other/index?id=' + pt_id
                })
              }
              else {
                console.log('aa')
                wx.showToast({
                  icon: 'none',
                  title: '当前拼团已结束\r\n距离下次开团时间约剩余：5分钟',
                  duration: 3000
                })
              }

            }
          }

        })

      })

     
    }
  },

  gotoOrderOther: function (e) {

    //activitystatus 1进行中 2未开始 3已结束
    if (this.data.activitystatus == 1)
    {
      if (this.data.hasping) {
        var pt_id = e.currentTarget.dataset.pt_id
        wx.navigateTo({
          url: '../order_other/index?id=' + pt_id
        })
      }
      else {
        console.log('aa')
        wx.showToast({
          icon: 'none',
          title: '当前拼团已结束\r\n距离下次开团时间约剩余：5分钟',
          duration: 3000
        })
      }
    }
    else if (this.data.activitystatus == 2)
    {
      wx.showToast({
        icon: 'none',
        title: '活动未开始',
        duration: 3000
      })

    }
    else
    {
      wx.showToast({
        icon: 'none',
        title: '活动已结束',
        duration: 3000
      })
    }

  },


  onLoad: function (option) {
    console.log('onload')
    console.log(option)
    //二维码
    if (option.scene) {
      wx.setStorageSync('share_userid', option.scene)
    }
    //链接带userid
    if(option.userid)
    {
      wx.setStorageSync('share_userid', option.userid)
    }
   
  },

  onHide:function(){
    console.log('onhide')
    clearInterval(this.data.interval)
  },

  onShow:function(){
    console.log('onshow')
    var _this =this
    handlogin.isLogin(() => {
      _this.getproduct()
      _this.getuserphone()
      // this.getping()
      var interval = setInterval(function () {
        if (handlogin.isLogin_true())
        {
          _this.getactivity()
        }
        else
        {
          clearInterval(interval)
        }
      }, 30000) //循环 
      _this.setData({interval:interval})
      _this.getpics()
    })

  },


//活动信息
  getactivity() {
    console.log('get getactivity')
    var _this = this
      wx.request({
        url: 'https://ping.quxunbao.cn/api/activity/getactivity',
        data: {
          'user_id': wx.getStorageSync('user_id'),
          's_id': wx.getStorageSync('s_id'),
        },
        method: 'POST',
        header: {
          'content-type': 'application/json'
        }, // 设置请求的 header
        success: function (res) {
          console.log(res)
          if (!res.data.err) {
            //判断时间
            var nowtime = Date.parse(new Date()) / 1000
            var starttime = res.data.starttime
            var endtime = res.data.endtime
            console.log(util.formatDateTime(endtime))
            if(nowtime>=starttime && nowtime<=endtime)
            {
              //进行中
              _this.setData({ activitystatus: 1})
              _this.getping()
            }
            else if(nowtime< starttime)
            {
              //未开始
              _this.setData({ activitystatus: 2, starttime: util.formatDateTime(starttime)})
            }
            else
            {
              //已结束
              _this.setData({ activitystatus: 3})
            }


          }
          else {
            wx.setStorageSync('loginstate', '')
            handlogin.handError(res)
          }
        }

      })
  },

  zhengce_tab: function () {
    console.log('zhengce')
    this.setData({
      showdetail: 1
    })

  },

  detail_tab: function () {
    console.log('detail')
    this.setData({
      showdetail: 2
    })

  },
  config_tab: function () {
    console.log('config')
    this.setData({
      showdetail: 3
    })
  },


getuserphone(){
  console.log('get phone')
  var _this = this
  handlogin.isLogin(() => {
    //用户信息
    wx.request({
      url: 'https://ping.quxunbao.cn/api/user/getInfo',
      data: {
        'user_id': wx.getStorageSync('user_id'),
        's_id': wx.getStorageSync('s_id'),
      },
      method: 'POST',
      header: {
        'content-type': 'application/json'
      }, // 设置请求的 header
      success: function (res) {
        console.log(res)
        if (!res.data.err) {
          if (res.data.phone) {
            _this.setData({hasphone:true})
          } 
        }
        else {
          handlogin.handError(res)
        }
      }

    })

  })
},

  zhengce_tab: function () {
    console.log('zhengce')
    this.setData({
      showdetail: 1
    })

  },

  detail_tab:function(){
    console.log('detail')
    this.setData({
      showdetail: 2
    })

  },
  config_tab: function () {
    console.log('config')
      this.setData({
        showdetail:3
      })
  },

  //产品
  getproduct(){
    console.log('getproduct')
    var _this=this
      handlogin.isLogin(()=>{
        wx.request({
          url: 'https://ping.quxunbao.cn/api/product',
          data: {
            'id': '5bda65617c65fac03d619993',
            'user_id': wx.getStorageSync('user_id'),
            's_id': wx.getStorageSync('s_id'),
          },
          method: 'POST',
          header: {
            'content-type': 'application/json'
          }, // 
          success: function (res) {
           
            if (!res.data.err) {
              console.log(res)
              _this.setData({ product: res.data })
              _this.getactivity()

            }
            else {
              wx.setStorageSync('loginstate','')
              console.log(res)
              handlogin.handError(res)
            }
          },
          complete:function(res){
            wx.hideLoading()
          }
        })
      })
  },


//图片
getpics(){
  console.log('get-getpics')
  //pics
  var _this =this
  wx.getFileInfo({
    filePath: wx.env.USER_DATA_PATH + '/toppic.jpg',
    success: res => {
      console.log('open loacl success')
      _this.setData({ toppic: wx.env.USER_DATA_PATH + '/toppic.jpg' })
    },
    fail: res => {
      console.log('save')
      app.saveindexfile('https://ping-1257242347.cos.ap-chongqing.myqcloud.com/truck.jpg', wx.env.USER_DATA_PATH + '/toppic.jpg')
      _this.setData({ toppic: 'https://ping-1257242347.cos.ap-chongqing.myqcloud.com/truck.jpg' })
    }
  })

  wx.getFileInfo({
    filePath: wx.env.USER_DATA_PATH + '/detail.jpg',
    success: res => {
      console.log('open loacl success')
      _this.setData({ detail: wx.env.USER_DATA_PATH + '/detail.jpg' })
    },
    fail: res => {
      console.log('save')
      app.saveindexfile('https://ping-1257242347.cos.ap-chongqing.myqcloud.com/detail.jpg', wx.env.USER_DATA_PATH + '/detail.jpg')
      _this.setData({ detail: 'https://ping-1257242347.cos.ap-chongqing.myqcloud.com/detail.jpg' })
    }
  })

  wx.getFileInfo({
    filePath: wx.env.USER_DATA_PATH + '/zhengce.jpg',
    success: res => {
      console.log('open loacl success')
      _this.setData({ zhengce: wx.env.USER_DATA_PATH + '/zhengce.jpg' })
    },
    fail: res => {
      console.log('save')
      app.saveindexfile('https://ping-1257242347.cos.ap-chongqing.myqcloud.com/policy.jpg', wx.env.USER_DATA_PATH + '/zhengce.jpg')
      _this.setData({ zhengce: 'https://ping-1257242347.cos.ap-chongqing.myqcloud.com/policy.jpg' })
    }
  })

  wx.getFileInfo({
    filePath: wx.env.USER_DATA_PATH + '/config.jpg',
    success: res => {
      console.log('open loacl success')
      _this.setData({ config: wx.env.USER_DATA_PATH + '/config.jpg' })
    },
    fail: res => {
      console.log(res)
      console.log('save')
      app.saveindexfile('https://ping-1257242347.cos.ap-chongqing.myqcloud.com/config.jpg', wx.env.USER_DATA_PATH + '/config.jpg')
      _this.setData({ config: 'https://ping-1257242347.cos.ap-chongqing.myqcloud.com/config.jpg' })
    }
  })

},


//拼团
getping(){
  console.log('get-ping')
  var _this = this
  //加载拼团
  wx.request({
    url: 'https://ping.quxunbao.cn/api/ping/currentPing',
    data: {
      'user_id': wx.getStorageSync('user_id'),
      's_id': wx.getStorageSync('s_id'),
    },
    method: 'POST',
    header: {
      'content-type': 'application/json'
    }, // 设置请求的 header
    success: function (res) {
      console.log(res)
      if (!res.data.err) {
        var expire = res.data.ping.expire
        var ser_utc = res.data.server_ts
        var now_utc = Date.parse(new Date()) / 1000
        var dis_utc = ser_utc - now_utc
        console.log(expire > ser_utc)
        if (expire > ser_utc) {
          _this.setData({ hasping: true })
          var rules = res.data.ping.rules
          var finish_num = res.data.ping.finish_num
          var i = 0
          var bonus = 0
          for (i = 0; i < rules.length; i++) {
            if (finish_num >= rules[i].num) {
              bonus = rules[i].bonus;
            }
          }
          res.data.ping.bonus = bonus
          _this.setData({ ping: res.data.ping })
          _this.setData({ expire: res.data.ping.expire, ser_utc: res.data.server_ts, dis_utc: dis_utc })
          // 执行倒计时函数
          _this.countDown();
        }
        else {
          _this.setData({ hasping: false })
        }

      }
      else
      {
        wx.setStorageSync('loginstate', '')
        _this.setData({ hasping: false })
        handlogin.handError(res)
      }



    },
    complete: function (res) {
      wx.hideLoading()
    }
    

  })

},

//下拉刷新
  onPullDownRefresh: function () {
    wx.stopPullDownRefresh();
    this.getproduct();
    this.getuserphone()
   
  },

  timeFormat:function(param) {//小于10的格式化函数
    return param < 10 ? '0' + param : param;
  },

  countDown: function () {//倒计时函数
    // 获取当前时间，同时得到活动结束时间数组
    let endTime = this.data.expire;
    let newTime = Date.parse(new Date());
    let expired = '';
    if (newTime / 1000 + this.data.dis_utc <= endTime) {
      // 对结束时间进行处理渲染到页面
     // console.log('countdwom')
      let obj = null;
      // 如果活动未结束，对时间进行处理

      let time = parseInt(endTime - Date.parse(new Date()) / 1000);
      // 获取天、时、分、秒
      let day = parseInt(time / (60 * 60 * 24));
      let hou = parseInt(time % (60 * 60 * 24) / 3600);
      let min = parseInt(time % (60 * 60 * 24) % 3600 / 60);
      let sec = parseInt(time % (60 * 60 * 24) % 3600 % 60);
      obj = {
        day: this.timeFormat(day),
        hou: this.timeFormat(hou),
        min: this.timeFormat(min),
        sec: this.timeFormat(sec)
      }

      expired = obj.day + '天' + obj.hou + '小时' + obj.min + '分' + obj.sec + '秒'

      // 渲染，然后每隔一秒执行一次倒计时函数
      this.setData({ expired: expired })
      setTimeout(this.countDown, 1000);
    }
    else {
      this.setData({ hasping: false }) 
    }
  },

  /**
 * 用户点击右上角分享
 */
  onShareAppMessage: function () {
    //带用户ID 带拼团ID
    var user_id = wx.getStorageSync('user_id');
    var name = wx.getStorageSync('name')
    var path='pages/index/index?userid='+user_id;

    return {
      title: '就差你了，'+name+'喊你来拼团抢三一了；最高4000元优惠不要白不要',
      imageUrl: '/images/share.png',
      path: path
    }
  }

})