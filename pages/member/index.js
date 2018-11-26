// pages/myincome/index.js
var handlogin = require('../../utils/handlelogin.js');
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userpacks: [],
    user:[]
    
  },


  qrcode: function () {
    var _this = this;
    handlogin.isLogin(() => {
      wx.request({
        url: 'https://' + app.globalData.host + '/api/user/wxacode2',
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
            var img = 'https://' + app.globalData.host +res.data.image
            console.log(img)
            wx.previewImage({
              current: img,
              urls: [img]
            })

          }
          else {
            handlogin.handError(res, _this.qrcode)
          }


        },
        complete: function (res) {
          wx.hideNavigationBarLoading()
          wx.hideLoading()
        }

      })
    })


  },





  gotoHome: function () {

    wx.redirectTo({
      url: '../index/index'
    })
  },

  myinfo: function () {

    wx.navigateTo({
  
      url: '../myinfo/index'
    })
  },

  zhengce: function () {

    wx.navigateTo({

      url: '../policy/index'
    })

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
   
  },
  onShow:function(){
    this.getdata()
  },




getdata:function()
{
    var _this =this;
  handlogin.isLogin(() => {
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
        if (!res.data.err) {

          console.log(res.data);
          _this.setData({name: res.data.name })
          _this.setData({ avatar: wx.getStorageSync('avatar') })

        }
        else {
          handlogin.handError(res,_this.getdata)
        }


      },
      complete: function (res) {
        wx.hideNavigationBarLoading()
        wx.hideLoading()
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
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
 * 用户点击右上角分享
 */
  onShareAppMessage: function () {
    //带用户ID 带拼团ID
    var user_id = wx.getStorageSync('user_id');
    var name = wx.getStorageSync('name')
    var path = 'pages/index/index?userid=' + user_id;
    name = name.substring(0, 4)
    return {
      title: '转发不买，也能赚大钱，' + name + '喊你来拼团，最高优惠4000元',
      imageUrl: '/images/share.png',
      path: path
    }
  }

})