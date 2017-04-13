import React, { Component } from 'react'
import {
    AppRegistry,
    StyleSheet,
    Dimensions,
    Text,
    Image,
    View,
    Slider,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator
} from 'react-native'
var { width, height } = Dimensions.get('window');
import Video from 'react-native-video'
var lyrObj = []   // 存放歌词

//  http://rapapi.org/mockjsdata/16978/rn_songList
//  http://tingapi.ting.baidu.com/v1/restserver/ting?method=baidu.ting.song.lry&songid=213508


export default class Main extends Component {

    constructor(props) {
        super(props);
        this.state = {
            songs: [],   //数据源
            pic_small: '',    //小图
            pic_big: '',      //大图
            file_duration: 0,    //歌曲长度
            song_id: '',     //歌曲id
            title: '',       //歌曲名字
            author: '',      //歌曲作者
            file_link: '',   //歌曲播放链接
            songLyr: [],     //当前歌词
            sliderValue: 0,    //Slide的value
            pause: false,       //歌曲播放/暂停
            currentTime: 0.0,   //当前时间
            duration: 0.0,     //歌曲时间
            currentIndex: 0,    //当前第几首
            isplayBtn: require('./image/播放.png')  //播放/暂停按钮背景图
        }
    }
    //上一曲
    prevAction = (index) => {
        lyrObj = [];
        if (index == -1) {
            index = this.state.songs.length - 1 // 如果是第一首就回到最后一首歌
        }
        this.setState({
            currentIndex: index  //更新数据
        })
        this.loadSongInfo(index)  //加载数据
    }
    //下一曲
    nextAction = (index) => {
        lyrObj = [];
        if (index == this.state.songs.length) {
            index = 0 //如果是最后一首就回到第一首
        }
        this.setState({
            currentIndex: index  //更新数据
        })
        this.loadSongInfo(index)   //加载数据
    }
    //播放/暂停
    playAction = () => {
        this.setState({
            pause: !this.state.pause
        })
        //判断按钮显示什么
        if (this.state.pause == true) {
            this.setState({
                isplayBtn: require('./image/播放.png')
            })
        } else {
            this.setState({
                isplayBtn: require('./image/暂停.png')
            })
        }

    }
    //播放器每隔250ms调用一次
    onProgress = (data) => {
        let val = parseInt(data.currentTime)
        this.setState({
            sliderValue: val,
            currentTime: data.currentTime
        })
    }
    //把秒数转换为时间类型
    formatTime(time) {
        // 71s -> 01:11
        let min = Math.floor(time / 60)
        let second = time - min * 60
        min = min >= 10 ? min : '0' + min
        second = second >= 10 ? second : '0' + second
        return min + ':' + second
    }
    // 歌词
    renderItem() {
        // 数组
        var itemAry = [];
        for (var i = 0; i < lyrObj.length; i++) {
            var item = lyrObj[i].txt

            if (i < 2){
                itemAry.push(
                    <View key={i} style={styles.itemStyle}>
                       
                        <Text style={{ color: 'blue' }}>  </Text>
                    </View>
                );

            }
            if (this.state.currentTime.toFixed(2) > lyrObj[i].total) {
                //正在唱的歌词
                itemAry.push(
                    <View key={i + 2} style={styles.itemStyle}>
                       
                        <Text style={{ color: 'blue' }}> {item} </Text>
                    </View>
                );
                _scrollView.scrollTo({ x: 0, y: (25 * i), animated: false });
            }
            else {
                //所有歌词
                itemAry.push(
                    <View key={i + 2} style={styles.itemStyle}>
                        <Text style={{ color: 'red'}}> {item} </Text>
                    </View>
                )
            }
        }

        return itemAry;
    }
    // 播放器加载好时调用,其中有一些信息带过来
    onLoad = (data) => {
        this.setState({ duration: data.duration });
    }

    loadSongInfo = (index) => {
        //加载歌曲
        fetch('http://rapapi.org/mockjsdata/16978/rn_songList')
            .then((response) => response.json())
            .then((responseJson) => {
                let songList = responseJson.song_list //取出json中的歌曲数组
                this.setState({
                    songs: songList,   //设置数数据源
                    pic_small: songList[index].pic_small, //小图
                    pic_big: songList[index].pic_big,  //大图
                    title: songList[index].title,     //歌曲名
                    author: songList[index].author,   //歌手
                    file_link: songList[index].file_link,   //播放链接
                    file_duration: songList[index].file_duration //歌曲长度
                })



                //加载歌词
                let songid = this.state.songs[index].song_id
                let url = 'http://tingapi.ting.baidu.com/v1/restserver/ting?method=baidu.ting.song.lry&songid=' + songid
                fetch(url)
                    .then((response) => response.json())
                    .then((responseJson) => {

                        let lry = responseJson.lrcContent
                        let lryAry = lry.split('\n')   //按照换行符切数组
                        lryAry.forEach(function (val, index) {
                            var obj = {}   //用于存放时间
                            val = val.replace(/(^\s*)|(\s*$)/g, '')    //正则,去除前后空格
                            let indeofLastTime = val.indexOf(']')  // ]的下标
                            let timeStr = val.substring(1, indeofLastTime) //把时间切出来 0:04.19
                            let minSec = ''
                            let timeMsIndex = timeStr.indexOf('.')  // .的下标
                            if (timeMsIndex !== -1) {
                                //存在毫秒 0:04.19
                                minSec = timeStr.substring(1, val.indexOf('.'))  // 0:04.
                                obj.ms = parseInt(timeStr.substring(timeMsIndex + 1, indeofLastTime))  //毫秒值 19
                            } else {
                                //不存在毫秒 0:04
                                minSec = timeStr
                                obj.ms = 0
                            }
                            let curTime = minSec.split(':')  // [0,04]
                            obj.min = parseInt(curTime[0])   //分钟 0
                            obj.sec = parseInt(curTime[1])   //秒钟 04
                            obj.txt = val.substring(indeofLastTime + 1, val.length) //歌词文本: 留下唇印的嘴
                            obj.txt = obj.txt.replace(/(^\s*)|(\s*$)/g, '')
                            obj.dis = false
                            obj.total = obj.min * 60 + obj.sec + obj.ms / 100   //总时间
                            if (obj.txt.length > 0) {
                                lyrObj.push(obj)
                            }
                        })
                    })

            })
    }


    componentWillMount() {
        this.loadSongInfo(0)   //预先加载第一首
    }

    render() {
        //如果未加载出来数据 就一直转菊花
        if (this.state.songs.length <= 0) {
            return (
                <ActivityIndicator
                    animating={this.state.animating}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    size="large" />
            )
        } else {
            //数据加载出来
            return (
                <View style={styles.container}>
                    <Image source={{ uri: this.state.pic_big }} style={{ width: width, height: 200 }} />
                    {/*播放器*/}
                    <Video
                        source={{ uri: this.state.file_link }}   // Can be a URL or a local file.
                        ref='video'                           // Store reference
                        rate={1.0}                     // 0 is paused, 1 is normal.
                        volume={1.0}                   // 0 is muted, 1 is normal.
                        muted={false}                  // Mutes the audio entirely.
                        paused={this.state.pause}                 // Pauses playback entirely.
                        onProgress={(e) => this.onProgress(e)}
                        onLoad={(e) => this.onLoad(e)}
                    />
                    {/*歌曲信息*/}
                    <View style={styles.playingInfo}>
                        <Text>{this.state.author} - {this.state.title}</Text>
                        <Text>{this.formatTime(Math.floor(this.state.currentTime))} - {this.formatTime(Math.floor(this.state.duration))}</Text>
                    </View>
                    {/*进度条*/}
                    <Slider
                        ref='slider'
                        style={{ marginLeft: 10, marginRight: 10 }}
                        value={this.state.sliderValue}
                        maximumValue={this.state.file_duration}
                        step={1}
                        minimumTrackTintColor='#FFDB42'
                        onValueChange={(value) => {
                            this.setState({
                                currentTime: value
                            })
                        }
                        }
                        onSlidingComplete={(value) => {
                            this.refs.video.seek(value)
                        }}
                    />
                    {/*歌曲按钮*/}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                        <TouchableOpacity onPress={() => this.prevAction(this.state.currentIndex - 1)}>
                            <Image source={require('./image/上一首.png')} style={{ width: 30, height: 30 }} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => this.playAction()}>
                            <Image source={this.state.isplayBtn} style={{ width: 30, height: 30 }} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => this.nextAction(this.state.currentIndex + 1)}>
                            <Image source={require('./image/下一首.png')} style={{ width: 30, height: 30 }} />
                        </TouchableOpacity>
                    </View>

                    {/*歌词*/}
                    <View style={{ height: 125, alignItems: 'center' ,marginTop:50}}>
                        <ScrollView style={{ position: 'relative' }}
                            ref={(scrollView) => { _scrollView = scrollView }}
                            snapToInterval = {30}
                        >
                            {this.renderItem()}
                        </ScrollView>
                    </View>

                </View>
            )
        }

    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    image: {
        flex: 1
    },
    playingControl: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 10,
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 20
    },
    playingInfo: {
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        paddingTop: 20,
        paddingLeft: 20,
        paddingRight: 20
    },
    text: {
        color: "black",
        fontSize: 22
    },
    modal: {
        height: 300,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
        paddingTop: 5,
        paddingBottom: 50
    },
    itemStyle: {
        height: 25,
        alignItems: 'center'
    }
})