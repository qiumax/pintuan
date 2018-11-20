const app = getApp()
var util = require('../../utils/util.js');
var handlogin = require('../../utils/handlelogin.js');
Page({
  data: {
    userInfo: getApp().globalData.userInfo,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    host: getApp().globalData.host,
    currentId:0,
    allpings: [],//全部
    succpings:[],//成功
    almostpings:[],//拼团中
  },


  gotoHome: function () {

    wx.redirectTo({
      url: '../index/index'
    })
  },


 //导航栏切换
  tabChoice: function (e) {
    var tabid = e.currentTarget.dataset.tabid
    this.setData({ currentId: tabid })
  },

  onLoad: function (options) {
    //获取传过来的user_ping_id
    var user_ping_id = options.user_ping_id

    if(user_ping_id)//跳转进入详情
    {
      
      app.getUserping(user_ping_id).then((res) => {
          //判断状态 进入不同的页面
          if(res.data.ping_id.state == 1)
          {
            wx.navigateTo({
              url: '../ptshare/index?pingid=' + user_ping_id
            })
          }
          else
          {
            wx.navigateTo({
              url: '../ptcomplete/index?pingid=' + user_ping_id
            })
          }

      })
      
    }

   
  },

onShow:function(){
  this.getData();
},


  getData: function () {
    console.log('getdata');
    var _this = this;
    //加载我的拼团
    handlogin.isLogin(() => {
            app.getUserpings().then(function (res) {
              console.log(res)
              if (!res.data.err) {//没有记录
                  if (res.data.length == 0) {
                    console.log('none1');
                  }
                  else if (res.data.length > 0) {
                    console.log(res.data)
                    //循环 结果
                    var allpings = []
                    var almostpings = []
                    var succpings = []
                    res.data.forEach((v, i) => {
                      console.log(v)

                      //判断状态
                      if (v.ping_id.state >= 0) {
                        allpings.push(res.data[i])
                        if (v.ping_id.state == 1) {
                          almostpings.push(res.data[i])
                        }
                        if (v.ping_id.state == 2) {
                          succpings.push(res.data[i])
                        }
                      }

                    })

                    _this.setData({ succpings: succpings })
                    _this.setData({ allpings: allpings })
                    _this.setData({ almostpings: almostpings })

                  }
                  else {
                    console.log('none2');
                  }
              }
              else {
                handlogin.handError(res)
              }
              
            })
      })
  },

  gotopingdetail: function (e) {
    var ping_id = e.currentTarget.dataset.ping_id
    //判断状态
    app.getUserping(ping_id).then((res) => {
      console.log(res.data)
      if(res.data)
      {
        console.log(res.data[0])
        if(res.data.ping_id.state == 2)
        {
            wx.navigateTo({
              url: '../ptcomplete/index?pingid=' + ping_id
            })

        }
        else if (res.data.ping_id.state == 1){
          wx.navigateTo({
            url: '../ptshare/index?pingid=' + ping_id
          })
        }
        else
        {
          console.log('aa')
        }
      }

     })

  },
  onPullDownRefresh: function () {
    wx.stopPullDownRefresh();
    this.getData();
  },


})