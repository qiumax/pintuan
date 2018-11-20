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

  hidepic: function () {
    console.log('hide');
    wx.hideToast();
    this.setData({ isTrue: false })
  },

  qrcode: function () {
    var _this =this
    this.setData({ isTrue: true })
    wx.getFileInfo({
      filePath: wx.env.USER_DATA_PATH + '/mycode.png',
      success: res => {
        wx.showToast({
          title: '正在生成二维码',
          icon: 'none',
          duration: 10000
        })
        _this.setData({ qrcode: wx.env.USER_DATA_PATH + '/mycode.png' })
        wx.saveImageToPhotosAlbum({
          filePath: wx.env.USER_DATA_PATH + '/mycode.png',
          success(result) {
            wx.hideToast()
            wx.showToast({
              title: '保存成功，从相册中分享到朋友圈吧',
              icon: 'none',
              duration: 10000
            })
          },
          fail: function (res) {

            wx.hideToast()
            wx.showToast({
              title: '图片保存失败',
              icon: 'none',
              duration: 10000
            })
          }
        })

      },
      fail:res=>{
        _this.generatePic()
      }
    })

  },

  generatePic: function () {
    console.log('generate')
    var _this = this

        wx.showToast({
          title: '正在生成二维码',
          icon: 'none',
          duration: 10000
        })
        //背景图
        wx.getImageInfo({
          src: '/images/base.jpg',
          success(res_bg) {
            console.log(res_bg)
            //计算位置
            var left = 0
            var top = 0
            //
           
            const ctx = wx.createCanvasContext('shareCanvas')
            ctx.drawImage('/images/base.jpg', left, top, res_bg.width, res_bg.height)
            console.log(wx.getStorageSync('avatar'))
            //下载avatar
            wx.downloadFile({
              url: wx.getStorageSync('avatar'),
              success(res) {
                console.log('download success')
                //avatar
                wx.getImageInfo({
                  src: res.tempFilePath,
                  success(res_avatar) {
                    console.log('res_avatar_ok')
                    const avaImgSize = 300
                    const avaleft = 390
                    const avatop = 135
                    ctx.strokeStyle = 'rgba(1,1,1,0)';
                    ctx.save(); // 先保存状态 已便于画完圆再用
                    ctx.beginPath(); //开始绘制
                    //先画个圆  
                    ctx.arc(540, 285, 150, 0, Math.PI * 2, false);
                    ctx.stroke();
                    ctx.clip();//画了圆 再剪切  原始画布中剪切任意形状和尺寸。一旦剪切了某个区域，则所有之后的绘图都会被限制在被剪切的区域内
                    ctx.drawImage(res.tempFilePath, avaleft, avatop, avaImgSize, avaImgSize); // 推进去图片
                    ctx.restore(); //恢复之前保存的绘图上下文 恢复之前保存的绘图上下午即状态 可以继续绘制
                    // 小程序码
                    const qrImgSize = 330
                    wx.request({
                      url: 'https://ping.quxunbao.cn/api/user/wxacode',
                      data: {
                        'user_id': wx.getStorageSync('user_id'),
                        's_id': wx.getStorageSync('s_id'),
                        'scene': wx.getStorageSync('user_id'),
                      },
                      method: 'post',
                      dataType: 'json',
                      responseType: 'arraybuffer',
                      success: function (res) {
                        console.log(res)
                        var wxfile = wx.getFileSystemManager()
                        var savedFilePath = `${wx.env.USER_DATA_PATH}/code.png`;
                        const base64 = wx.arrayBufferToBase64(res.data);
                        console.log(savedFilePath)
                        wxfile.writeFile({
                          filePath: savedFilePath,
                          data: base64,
                          encoding: 'base64',
                          success: res => {
                            console.log(res)
                            wx.getImageInfo({
                              src: savedFilePath,
                              success(res) {
                                console.log('saved ok')
                                ctx.drawImage(savedFilePath, 395, 1435, qrImgSize, qrImgSize)
                                ctx.stroke()
                                wx.hideToast()
                                console.log('drawing')
                                ctx.draw(true, () => {
                                  _this.saveImage(left, top, res_bg.width, res_bg.height)
                                  console.log('draw callback')
                                  wx.showToast({
                                    title: '正在保存图片',
                                    icon: 'none',
                                    duration: 10000
                                  })
                                  
                                 _this.setData({ qrcode: 'sss' });
                                })
                              },
                              fail(res) {
                                console.log(res)
                              }
                            })
                          },
                          fail: res => {
                            console.log('failed')
                          }
                        })
                      }
                    })
                  },
                  fail(res) {
                    console.log(res)
                    console.log('res_avatar_fail')
                  }
                })
              },
              fail(res) {
                console.log(res)
              }
            })
          }
        })
     
  },

  saveImage: function (x, y, width, height) {
    let that = this
    wx.canvasToTempFilePath({
      x: x,
      y: y,
      width: width,
      height: height,
      canvasId: 'shareCanvas',
      success: function (res) {
        console.log(res)
        //存储文件
        var fs = wx.getFileSystemManager()
        wx.saveFile({
          tempFilePath: res.tempFilePath,
          filePath: wx.env.USER_DATA_PATH + '/mycode.png',
          success: res => {
            console.log('save sucess')
            that.saveImageToPhotos(wx.env.USER_DATA_PATH + '/mycode.png');
          },
          fail: res => {
            console.log(res)
            console.log('save failed')
          }

        })
      },
      fail: function (res) {
        wx.hideToast()
        wx.showToast({
          title: '图片生成失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  saveImageToPhotos: function (tempFilePath) {
    var _this =this
    wx.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success(result) {
        wx.hideToast()

        _this.setData({qrcode: wx.env.USER_DATA_PATH + '/mycode.png' })

        wx.showToast({
          title: '保存成功，从相册中分享到朋友圈吧',
          icon: 'none',
          duration: 8000
        })
      },
      fail: function (res) {
        console.log(tempFilePath)
        console.log(res)
        wx.hideToast()
        wx.showToast({
          title: '图片保存失败',
          icon: 'none',
          duration: 10000
        })
      }
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
          _this.setData({name: res.data.name })
          _this.setData({ avatar: wx.getStorageSync('avatar') })

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
    }),

    wx.getFileInfo({
      filePath: wx.env.USER_DATA_PATH + '/mycode.png',
      success: res => {
        _this.setData({ qrcode: wx.env.USER_DATA_PATH + '/mycode.png'})
      }
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

  }


})