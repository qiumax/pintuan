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
    hasphone:true,//是否有电话信息
    activitystatus:0, //
    interval:0,
    counttimeout:0,
    starttime:'',//开始时间
    ping:[],
    share_userid: '',//分销用户id
    hasping:false,//判断当前是否有拼团
    expire:0//带链接拼团id的过期时间
  },


  gotoHome:function(){
    console.log('clear interval')
    clearInterval(this.data.interval)
    clearTimeout(this.data.counttimeout)
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
          url: 'https://'+app.globalData.host+'/api/user/getphone',
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
                  url: 'https://'+app.globalData.host+'/api/user/updateInfo',
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
           
            clearInterval(_this.data.interval)
            clearTimeout(_this.data.counttimeout)
            if (btn_type == 'member')
            {
              console.log('clear interval')
              wx.switchTab({
                url: '../member/index'
              })
            }
            else
            {
              if (_this.data.activitystatus == 1) {
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
              else if (_this.data.activitystatus == 2) {
                wx.showToast({
                  icon: 'none',
                  title: '活动未开始',
                  duration: 3000
                })

              }
              else {
                wx.showToast({
                  icon: 'none',
                  title: '活动已结束',
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

    console.log('clear interval')
    clearInterval(this.data.interval)
    clearTimeout(this.data.counttimeout)
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
    console.log(app.globalData.host)
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
    this.setData({activity:''})
    console.log(this.data.interval)
    console.log(this.data.counttimeout)
    clearInterval(this.data.interval)
    clearTimeout(this.data.counttimeout)
    console.log('onhide')
  },

  onShow:function(){
    console.log('onshow')
    var _this =this
    handlogin.isLogin(() => {
      _this.getproduct()

    })

  },


//活动信息
  getactivity() {
    console.log('get getactivity')
    var _this = this
      wx.request({
        url: 'https://'+app.globalData.host+'/api/activity/getactivity',
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
           
            handlogin.handError(res,_this.getactivity)
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
      url: 'https://'+app.globalData.host+'/api/user/getInfo',
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
          if (!res.data.phone) {
            _this.setData({hasphone:false})
          }
           
        }
        else {
          handlogin.handError(res, _this.getuserphone)
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
          url: 'https://'+app.globalData.host+'/api/product',
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
              _this.getuserphone()

              //清除定时任务 再开启
              clearInterval(_this.data.interval)

              wx.setStorageSync('picversion',res.data.version)
              var interval = setInterval(function () { 
                  _this.getactivity()
               
              }, 30000) //循环 
              _this.setData({ interval: interval })
              
              _this.getpics()
            }
            else {
              console.log(res)
              handlogin.handError(res,_this.getproduct)
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
  var version = 'v001'
  if (wx.getStorageSync('picversion'))
  {
    console.log(wx.getStorageSync('picversion'))
    version = wx.getStorageSync('picversion')
  }
    
  //pics
  var _this =this
  wx.getFileInfo({
    filePath: wx.env.USER_DATA_PATH + '/' + version+'toppic.jpg',
    success: res => {
      console.log('open loacl success')
      _this.setData({ toppic: wx.env.USER_DATA_PATH + '/' + version +'toppic.jpg' })
    },
    fail: res => {
      console.log('save')
      app.saveindexfile('https://ping-1257242347.cos.ap-chongqing.myqcloud.com/' + version +'/truck.jpg', wx.env.USER_DATA_PATH + '/'  + version+'toppic.jpg')
      _this.setData({ toppic: 'https://ping-1257242347.cos.ap-chongqing.myqcloud.com/' + version +'/truck.jpg' })
    }
  })

  wx.getFileInfo({
    filePath: wx.env.USER_DATA_PATH + '/' + version +'detail.jpg',
    success: res => {
      console.log('open loacl success')
      _this.setData({ detail: wx.env.USER_DATA_PATH + '/' + version +'detail.jpg' })
    },
    fail: res => {
      console.log('save')
      app.saveindexfile('https://ping-1257242347.cos.ap-chongqing.myqcloud.com/' + version + '/detail.jpg', wx.env.USER_DATA_PATH + '/' + version +'detail.jpg')
      _this.setData({ detail: 'https://ping-1257242347.cos.ap-chongqing.myqcloud.com/' + version +'/detail.jpg' })
    }
  })

  wx.getFileInfo({
    filePath: wx.env.USER_DATA_PATH + '/' + version +'zhengce.jpg',
    success: res => {
      console.log('open loacl success')
      _this.setData({ zhengce: wx.env.USER_DATA_PATH + '/' + version +'zhengce.jpg' })
    },
    fail: res => {
      console.log('save')
      app.saveindexfile('https://ping-1257242347.cos.ap-chongqing.myqcloud.com/' + version + '/policy.jpg', wx.env.USER_DATA_PATH + '/' + version +'zhengce.jpg')
      _this.setData({ zhengce: 'https://ping-1257242347.cos.ap-chongqing.myqcloud.com/' + version +'/policy.jpg' })
    }
  })

  wx.getFileInfo({
    filePath: wx.env.USER_DATA_PATH + '/' + version +'config.jpg',
    success: res => {
      console.log('open loacl success')
      _this.setData({ config: wx.env.USER_DATA_PATH + '/' + version +'config.jpg' })
    },
    fail: res => {
      console.log(res)
      console.log('save')
      app.saveindexfile('https://ping-1257242347.cos.ap-chongqing.myqcloud.com/' + version + '/config.jpg', wx.env.USER_DATA_PATH + '/' + version +'config.jpg')
      _this.setData({ config: 'https://ping-1257242347.cos.ap-chongqing.myqcloud.com/' + version +'/config.jpg' })
    }
  })

},


//拼团
getping(){
  console.log('get-ping')
  var _this = this
  //加载拼团
  wx.request({
    url: 'https://'+app.globalData.host+'/api/ping/currentPing',
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
        console.log(res.data.ping.finish_num )
        if (expire > ser_utc && res.data.ping.finish_num<200) {
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
        _this.setData({ hasping: false })
        handlogin.handError(res,_this.getping)
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
   
  },

  timeFormat:function(param) {//小于10的格式化函数
    return param < 10 ? '0' + param : param;
  },

  countDown: function () {//倒计时函数
    clearTimeout(this.data.counttimeout)
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
      //var countInterval = setInterval(function() {
     //   this.countDown
     // }, 1000)
      var counttimeout  = setTimeout(this.countDown, 1000);
      this.setData({ counttimeout: counttimeout})
      
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
    name = name.substring(0,4)
    return {
      title: '转发不买，也能赚大钱，'+name+'喊你来拼团，最高优惠4000元',
      imageUrl: '/images/share.png',
      path: path
    }
  }

})