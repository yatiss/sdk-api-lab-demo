import {PID_TYPE} from "./config";
import {
    SECRET_DATA,
    getServerData
} from './server';

/**
 * 此页面为备课模式入口页demo
 * 打开此页面会执行自动登录
 */
class main {
    constructor() {
        // this.DEBUG = true; // 是否为内部调试版本,nobook方面使用，其他用户要设置为false
        this.testediter = false; // 用本地editor做调试,nobook方面使用，其他用户要设置为false
        this.testplayer = false; // 用本地player做调试,nobook方面使用，其他用户要设置为false
        // 测试取单条实验数据
        // 需要取实验的id: 5b0e184bf7d856214248caed  949b34400544404230c16798eb442fd0
        this.testCheckId = 'b720d31dee6fc2ae89709c4eaec45251'; // 要查询的实验id(测试数据)
        /**************************************************************
         *                              账户信息
         **************************************************************/
        // 固定信息
        this.appid = SECRET_DATA.appid; // nobook提供
        this.appkey = SECRET_DATA.appkey; // 重要注意: nobook提供(appkey需后台保存,如果前台暴露引发任何损失概不负责)
        this.pid = PID_TYPE.PHYSICAL; // nobook提供
        // 需传入信息
        this.uid = 'zuoyebangtest6'; // 用户账户,必填,需传入 en5testid4
        this.nickname = '测试6'; // 用户昵称,可选,需传入dsfs
        this.labId = ''; // 实验id,列表接口获取,在预览与编辑时需传入
        // 生成信息
        this.token = null; // 登录后返回
        /**************************************************************
         *                              接口信息
         **************************************************************/
        // host地址,正式版用后面的
        this.editHost = this.DEBUG ? 'http://192.168.1.22:3033' : 'https://wuli.nobook.com'; // 编辑地址host
        if (this.testediter) {
            this.editHost = 'http://localhost:3033';
        }
        this.docHost = this.DEBUG ? 'http://res-api.nobook.cc' : 'https://res-api.nobook.com'; // 正式接口地址的host
        this.iconHost = this.DEBUG ? 'http://192.168.1.6:3080' : 'https://wuli.nobook.com'; // 缩略图域名

        //  接口地址
        this.playurl = 'http://wuliplayer.nobook.com?sourceid='; // 实验预览地址
        if(this.testplayer) {
            this.playurl = 'http://localhost:4800?sourceid='; // 实验预览地址(内网测试部分)
        }
        this.editurl = ''; // 实验编辑地址,在自动登录完成后生成
        this.loginURL = `${this.docHost}/api/resapi/v1/login`; // 登录接口
        this.getListURL = `${this.docHost}/api/resapi/v1/resources/get`; // 获取资源实验列表接口
        this.getMyLabDataURL = `${this.docHost}/api/resapi/v1/myresources/get`; // 获取我的实验列表接口
        this.delLabDataURL = `${this.docHost}/api/resapi/v1/myresources/del`; // 删除一个实验接口
        this.renameLabDataURL = `${this.docHost}/api/resapi/v1/myresources/rename`; // 重命名一个实验接口
        this.classificationsURL = `${this.docHost}/api/resapi/v1/resources/classifications`; // 实验资源类别接口
        this.feedbackURL = `${this.docHost}/api/resapi/v1/feedback/save`; // 反馈接口
        this.checkInfoURL = `${this.docHost}/api/resapi/v1/myresources/info`; // 根据id查询实验详细信息
        /**************************************************************
         *                              页面加载完成初始化
         **************************************************************/
        $(() => {
            // 自动登录(所有操作必须登陆后执行)
            this.login().then((data) => {
                layer.msg('~登录成功:', data);
                console.log('~登录成功:', data);
                this.token = data.token;
                console.log('token:', this.token);
                this.editurl = `${this.editHost}/#/physics-courseware?token=${data.token}&uid=${data.uid}&labid=`;
                this.init();
            }).catch((err) => {
                console.warn(err);
            });
        });
    }

    /**************************************************************
     *                              demo页面内存操作部分
     **************************************************************/
    /**
     * 初始化
     */
    init() {
        // 刷新左右侧列表
        this.freshList();
        // 与iframe交互
        window.addEventListener('message', (event) => {
            const data = event.data || {};
            if (data.type === 'PHYSICS_SDK_INTERFACE_SAVE_RESPONSE') {
                // 保存实验回调
                this._saveData_resolve(data.result);// {success:状态, id:实验id}
                this._saveData_resolve = null;
            } else if(data.type === 'onload') {
                console.log('******************页面加载完成!!!');
            }
        });
    }

    /**
     * 给页面按钮添加事件
     */
    freshBtnHandles() {
        // 实验按钮
        $('.lab-btn ').off('click');
        $('.lab-btn').click(evt => {
            console.log(evt.target.textContent);
            this.freshRightList(evt.target.textContent);
        });
        this.showType(1);
        // 返回按钮
        $('.return-cla ').off('click');
        $('.return-cla').click(() => {
            $('#editIframeId').attr('src', '');
            this.showType(1);
            // 刷新左右侧列表
            this.freshList();
        });
        $('.new-cla').off('click');
        $('.new-cla').click(() => {
            console.log('~新建实验');
            this.showType(3);
        });
        $('.check-cla').off('click');
        $('.check-cla').click(() => {
            console.log('~根据id查询实验信息');
            this.checkFromId();
        });
        // 编辑器插入实验
        $('.editor-insert-cla').off('click');
        $('.editor-insert-cla').click(() => {
            console.log('~编辑器插入实验:', this.labId);
            // 先保存,后插入
            this.saveData().then((result) => {
                // 从 result 中取实验id与缩略图地址
                console.log('~保存实验回调:', result);
            });
        });
        // 播放器插入实验
        $('.player-insert-cla').off('click');
        $('.player-insert-cla').click(() => {
            console.log('~播放器插入实验:', this.labId);
        });
        $('.save-cla').off('click');
        $('.save-cla').click(() => {
            console.log('~保存实验');
            /*
            // 自定义标题则如下使用
            this.saveData({title: '自定义标题' + new Date().getTime()}).then((result) => {
                console.log('~保存实验回调:', result);
                layer.msg('保存实验成功');
            });*/
            this.saveData().then((result) => {
                console.log('~保存实验回调:', result);
                layer.msg('保存实验成功');
            });
        });
        $('.feedback-cla').off('click');
        $('.feedback-cla').click(() => {
            console.log('~我要');
            $.post(this.feedbackURL, {
                title: '测试文本', // 标题【最大不能超过32个字符串】
                content: '测试文本的内容'+new Date().getTime(), // 内容
                pid: this.pid,
                source: '西沃', // 来源【对接公司名称】
                pics: '' // 图片超链接(非必须)
            }, (data) => {
                // data = typeof data === 'string' ? JSON.parse(data) : data;
            });

        });
    }

    /**
     * 刷新页面左右侧列表
     */
    freshList() {
        this.freshLeftList();
        this.freshRightList('我的实验');
        setTimeout(() => {
            this.freshBtnHandles();
        }, 1000);
    }

    /**
     * 刷新左侧列表
     */
    freshLeftList() {
        $('#leftId').empty();
        this.getClassificationsList().then((arr) => {
            this.addLeftList(arr);
        });
    }

    /**
     * 刷新右侧列表
     * @param typename
     */
    freshRightList(typename) {
        $('#rightId').empty();
        const isMy = typename === '我的实验'; // 是否为 我的实验 (否则为 资源实验)
        this.getLabList(typename, isMy).then((arr) => {
            this.addRightList(arr, isMy);
        });
    }

    /**
     * 在页面左侧添加元素
     * @param arr
     */
    addLeftList(arr) {
        for (let i = 0; arr && i < arr.length; i++) {
            const item = `<li><button class="lab-btn">${arr[i]}</button></li>`;
            $('#leftId').append(item);
        }
    }

    /**
     * 在页面右侧添加元素
     * @param arr
     * @param isMy
     */
    addRightList(arr, isMy) {
        for (let i = 0; arr && i < arr.length; i++) {
            let labItem = arr[i];
            let item;
            if (isMy) {
                item = this.getMyItem(labItem._id, labItem.title, `${this.iconHost}${labItem.properties.icon.url}`);
            } else {
                item = this.getSourceItem(labItem.id, labItem.name, `${this.editHost}/assets/model/uploads/${labItem.icon}`);
            }
            $('#rightId').append(item);
        }
        //
        $('.viewCla').off('click');
        $('.viewCla').on('click', (evt) => {
            let labId = evt.target.value;
            this.showType(2, labId);
        });
        //
        $('.editCla').off('click');
        $('.editCla').on('click', (evt) => {
            let labId = evt.target.value;
            this.showType(3, labId);
        });
        //
        $('.editClaSource').off('click');
        $('.editClaSource').on('click', (evt) => {
            let labId = evt.target.value;
            this.showType(4, labId);
        });
        //
        $('.delCla').off('click');
        $('.delCla').on('click', (evt) => {
            let labId = evt.target.value;
            this.delData(labId).then((obj) => {
                console.log('~删除:', obj.success, obj.msg);
                // 刷新右侧列表
                this.freshRightList('我的实验');
            });
        });
        //
        $('.renameCla').off('click');
        $('.renameCla').on('click', (evt) => {
            let labId = evt.target.value;
            let newName = $(evt.target).siblings('input').val();
            this.renameData(labId, newName).then((obj) => {
                console.log('~重命名:', obj);
                // 刷新右侧列表
                this.freshRightList('我的实验');
            });
        });
    }

    /**
     * 生成我的实验模块列表
     */
    getMyItem(id, name, iconURL) {
        return `
            <div class="item" style="background-image: url(${iconURL});">
                <button class="viewCla" value="${id}">预览</button>
                <button class="editCla" value="${id}">编辑</button>
                <button class="delCla" value="${id}">删除</button>
                <button class="renameCla" value="${id}">重命名</button>
                <input class="div-name" value="${name}"></input>
            </div>
        `;
    }

    /**
     * 生成资源模块列表
     */
    getSourceItem(id, name, iconURL) {
        return `
            <div class="item" style="background-image: url(${iconURL});">
                <button class="viewCla" value="${id}">预览</button>
                <button class="editClaSource" value="${id}">编辑</button>
                <div class="div-name">${name}</div>
            </div>
        `;
    }

    /**
     * 切换场景
     * @param type
     * @param labId
     */
    showType(type, labId) {
        this.labId = labId;
        $('#listBoxId,#editBoxId,#playBoxId').hide();
        switch (type) {
            case 1:
                $('#listBoxId').show();
                break;
            case 2:
                $('#playBoxId').show();
                if (labId) {
                    // 打开实验
                    console.log('预览:', labId);
                    $('#viewIframeId').attr('src', this.playurl + labId);
                }
                break;
            case 3:
                // 我的资源的新建/编辑功能
                $('#editBoxId').show();
                if (labId) {
                    // 通过实验id打开实验
                    console.log('~编辑实验:', this.editurl + labId);
                    $('#editIframeId').attr('src', this.editurl + labId);
                    this.freshEditData(); // 刷新使用场景数据
                } else {
                    // 新建实验
                    console.log('~新建实验:', this.editurl);
                    $('#editIframeId').attr('src', this.editurl);
                    this.freshEditData();
                }
                break;
            case 4:
                // 官方资源列表的编辑
                $('#editBoxId').show();
                if (labId) {
                    // 通过实验id打开实验
                    console.log('~官方列表:编辑实验:', this.editurl + labId+'&sourcefrom=1');
                    $('#editIframeId').attr('src', this.editurl + labId+'&sourcefrom=1');
                    this.freshEditData(); // 刷新使用场景数据
                }
                break;
        }
    }

    /**
     * 刷新实验场景(如果修改数据了)
     */
    freshEditData() {
        if ($('#editIframeId')[0]) {
            $('#editIframeId')[0].contentWindow.postMessage({type: 'PHYSICS_SDK_INTERFACE_FRESH_DATA'}, '*');
        }
    }

    /****************************************************************
     *                              实验接口测试部分
     ****************************************************************/
    /**
     * 获取获取资源类别接口
     */
    getClassificationsList() {
        return new Promise((resolve, reject) => {
            $.getJSON(this.classificationsURL, {
                pid: this.pid,
                token: this.token
            }, (data) => {
                if (data.code === 200) {
                    resolve(data.data);
                } else {
                    reject(data.msg);
                }
            });
        });
    }

    /**
     * 登录接口
     */
    login() {
        return new Promise((resolve, reject) => {
            const {timestamp, sign} = getServerData(this.uid, this.nickname, this.pid);
            const param = {};
            param.pid = this.pid;
            param.uid = this.uid;
            param.nickname = this.nickname;
            param.appid = this.appid;
            param.timestamp = timestamp;
            param.sign = sign;
            $.get(this.loginURL, param, (data, status) => {
                if (status === 'success') {
                    data = JSON.parse(data);
                    if (data.code === 200) {
                        resolve(data.data);
                    } else {
                        reject(data.msg);
                    }
                } else {
                    reject(status);
                }
            });
        });
    }

    /**
     * 保存接口（用 postMessage 发消息）
     * @returns {Promise<any>}
     */
    saveData(config) {
        if (this._saveData_resolve) {
            return Promise.resolve(null);
        }
        return new Promise((resolve) => {
            this._saveData_resolve = resolve;
            let data = {type: 'PHYSICS_SDK_INTERFACE_SAVE'};
            if (config && config.title) {
                data.title = config.title; // 标题可选
            }
            // 格式: type:xxx, title:xxxx（可选）
            $('#editIframeId')[0].contentWindow.postMessage(data, '*');
        });
    }

    /**
     * 删除实验接口
     * @param labId
     */
    delData(labId) {
        return new Promise((resolve, reject) => {
            $.post(this.delLabDataURL, {
                pid: this.pid,
                token: this.token,
                id: labId
            }, (data) => {
                data = typeof data === 'string' ? JSON.parse(data) : data;
                resolve({
                    success: data.code === 200,
                    msg: data.msg
                });
            });
        });
    }

    /**
     * 重命名接口
     * @param labId
     * @param name
     */
    renameData(labId, name) {
        return new Promise((resolve, reject) => {
            $.post(this.renameLabDataURL, {
                pid: this.pid,
                token: this.token,
                id: labId,
                title: name
            }, (data) => {
                data = typeof data === 'string' ? JSON.parse(data) : data;
                resolve({
                    success: data.code === 200,
                    msg: data.msg
                });
            });
        });
    }

    /**
     * 获取实验列表接口
     * @param typename 类型名称
     * @param isMy 是否为"我的实验"类型
     * @returns {Promise<any>}
     */
    getLabList(typename, isMy) {
        return new Promise((resolve, reject) => {
            const url = isMy ? this.getMyLabDataURL : this.getListURL;
            $.getJSON(url, {
                pid: this.pid,
                token: this.token,
                type: 'classification',
                typename: typename
            }, (data) => {
                if (data.code === 200) {
                    if (isMy) {
                        resolve(data.data.data);
                    } else {
                        resolve(data.data);
                    }
                } else {
                    reject(data.msg);
                }
            });
        });
    }

    /**
     * 获取单个实验详细信息的接口
     */
    checkFromId() {
        $.getJSON(this.checkInfoURL, {
            id: this.testCheckId,
            pid: this.pid,
            type: 'share'
        }, (data) => {
            // 实验不存在时 data.code 为500
            if (data.code === 200) {
                const obj = data.data;
                console.log('~实验昵称:', obj.title);
                console.log('~实验是否包含vip元件:', obj.content.phyData.properties.data.containsVipequ); // true代表有vip器材;false或undefined代表无vip器材
                console.log('~实验缩略图:', `${this.iconHost}${obj.properties.icon.url}`); // true代表有vip器材;false或undefined代表无vip器材
            } else {
            }
        });
    }
}

new main();