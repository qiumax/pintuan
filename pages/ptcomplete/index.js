// pages/ptshare/index.js
const app = getApp()
var handlogin = require('../../utils/handlelogin.js');
var util = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    pingid: '',
    ping: [],
    avatars: []

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var pingid = options.pingid
    console.log(pingid)
    this.setData({ pingid, pingid })
   

  },
  onShow:function(){
    this.getdata()
  },

  getdata: function () {
    var _this = this;
    handlogin.isLogin(() => {
        app.getUserping(this.data.pingid).then(function (res) {
          if (!res.data.err) {
            app.getavatarsfrompingid(res.data.ping_id._id).then(function (resavatar) {
              if(!resavatar.data.err){
                console.log(resavatar.data)
                res.data.finishtime = util.utcformat(res.data.updated_at)
                _this.setData({ ping: res.data })
                _this.setData({ avatars: resavatar.data })
              }
              else
              {
                handlogin.handError(res)
              }

            })
          }
          else {
            handlogin.handError(res)
          }

   
        })
    })

  },


  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.getdata()
  },



  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    var user_id = wx.getStorageSync('user_id');
    var path = 'pages/index/index?userid=' + user_id;
    return {
      title: '三一重卡',
      imageUrl: '/images/share.png',
      //path: 'pages/index/index?pingid='+this.data.pingid
      path: path
    }
  }
})