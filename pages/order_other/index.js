const app = getApp()
var util = require('../../utils/util.js');
var handlogin = require('../../utils/handlelogin.js');
Page({
  data: {
      avatars:[],
      ping:[],
      name: '',
      phone: '',
      code:'',
      formid: '',
      pingid:'',
      sendtime:0
        
  },

  submit: function (e) {
    console.log(e)
    var name = this.data.name
    var phone = this.data.phone
    var code = this.data.code
    var formid = e.detail.formId
    var pingid = this.data.pingid
    //name phone 不能为空
    if (!name || name == '') {
      wx.showToast({
        title: '姓名不能为空！',
        icon: 'none',
        duration: 1000
      })
      return false;
    }

    if (!phone || phone == '') {
      wx.showToast({
        title: '手机号码不能为空！',
        icon: 'none',
        duration: 1000
      })
      return false;
    }

    if (code !== '') {
      var storecode = wx.getStorageSync('code')
      if (code != storecode) {
        wx.showToast({
          title: '验证码错误！',
          icon: 'none',
          duration: 1000
        })
        return false;
      }
    }

    var product_id = '5bda65617c65fac03d619993'
    var nonce_str = util.randomString()
    var timestamp = Date.parse(new Date()) / 1000
    var reg = /^\d{11}$/;
    if (!reg.test(phone)) {
      wx.showToast({
        icon: 'none',
        title: '手机号码格式不正确',
      })
      return false;
    }
    wx.request({

      url: 'https://ping.quxunbao.cn/api/ping/joinPing',
      data: {
        'user_id': wx.getStorageSync('user_id'),
        's_id': wx.getStorageSync('s_id'),
        'product_id': product_id,
        'name': name,
        'phone': phone,
        'form_id': formid,
        'attach': 'attach',
        'nonce_str': nonce_str,
        'ping_id': pingid,
        'timestamp': timestamp
      },
      method: 'POST',
      header: {
        'content-type': 'application/json'
      }, // 设置请求的 header
      success: function (res) {
        if(res.data.err){
          wx.showToast({
            icon:'none',
            title: res.data.err,
            duration:5000
          })
          return false
        }
        console.log(res);
        var packagestr = "prepay_id=" + res.data.prepay_id
        //返回成功，调用支付
        wx.requestPayment({
          timeStamp: timestamp.toString(),
          nonceStr: nonce_str,
          package: packagestr,
          signType: 'MD5',
          paySign: res.data._paySignjs,
          //支付成功->
          success(res) {
            wx.showToast({
              title: '支付成功',
            })

            setTimeout(function () {
              wx.hideToast();
            })
            
            wx.switchTab({
              url: '/pages/mypings/index',
            })

          },
          //支付失败
          fail(res) {
            wx.showToast({
              title: '支付失败',
            })
            setTimeout(function () {
              wx.hideToast();
            })
          }
        })

      }


    })
  },

  onPullDownRefresh: function () {
    wx.stopPullDownRefresh();
    var _this = this;
    _this.getpintuan() 
    _this.getavatars() 
    _this.getinfo()    
  },


  onLoad: function (option) {
    this.setData({pingid:option.id})
  },

onShow:function(){
  var _this = this;
  _this.getpintuan()
  _this.getavatars()
  _this.getinfo()  
},

  phone_input: function (e) {
    this.setData({
      phone: e.detail.value
    })
  },

  code_input: function (e) {
    this.setData({
      code: e.detail.value
    })
  },

  name_input: function (e) {
    this.setData({
      name: e.detail.value
    })
  },

  sendsms: function (e) {
    var nowtime = Date.parse(new Date())
    console.log(nowtime)
    if (nowtime - this.data.sendtime < 60000) {
      wx.showToast({
        title: '请一分钟后再试',
        icon: 'none',
        duration: 1000
      })
      return false;
    }
    var _this=this
    var phone = this.data.phone
    if (!phone || phone == '') {
      wx.showToast({
        title: '手机号码不能为空！',
        icon: 'none',
        duration: 1000
      })
      return false;
    }
    var reg = /^\d{11}$/;
    if (!reg.test(phone)) {
      wx.showToast({
        icon: 'none',
        title: '手机号码格式不正确',
        duration: 1000
      })
      return false;
    }
    var code = util.randomStringnum()
    wx.setStorageSync('code', code)
    handlogin.isLogin(() => {
      wx.showToast({
        icon: 'success',
        title: '正在发送',
        duration: 1000
      })
      
      wx.request({
        url: 'https://ping.quxunbao.cn/api/sms/sendsms',
        data: {
          'user_id': wx.getStorageSync('user_id'),
          's_id': wx.getStorageSync('s_id'),
          'phonenum': phone,
          'code': code
        },
        method: 'POST',
        header: {
          'content-type': 'application/json'
        }, // 设置请求的 header
        success: function (res) {
          wx.hideToast()
          if (res.data.result == 0) {
            _this.setData({ sendtime: Date.parse(new Date()) })
            wx.showToast({
              icon: 'success',
              title: '发送成功',
              duration: 1000
            })
          }
          else {
            wx.showToast({
              icon: 'none',
              title: res.data.errmsg,
              duration: 1000
            })

          }

        }

      })
    })
  },

getpintuan(){
  var _this =this
  handlogin.isLogin(() => {
    //拼团
    app.getpingInfo(_this.data.pingid).then(function (res) {

      if (!res.data.err) {
        _this.setData({ ping: res.data[0] })
      }
      else {
        handlogin.handError(res)
      }
     
    })
  })
},

getavatars(){
  var _this = this
  handlogin.isLogin(() => {
    //头像
    app.getavatarsfrompingid(_this.data.pingid).then(function (res) {

      if (!res.data.err) {
        _this.setData({ avatars: res.data })
      }
      else {
        handlogin.handError(res)
      }

    })
  })
},

getinfo(){
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
        if (!res.data.err) {
          console.log(res.data);
          _this.setData({ userinfo: res.data })

          _this.setData({ user: res.data })
          _this.setData({
            name: res.data.name,
            phone: res.data.phone,
          })
        }
        else {
          handlogin.handError(res)
        }


      },
      complete: function (res) {
        wx.hideNavigationBarLoading()
        wx.hideLoading()
      }

    })

  })
}


})