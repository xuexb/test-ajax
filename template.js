var template = require('art-template/node/template-native.js');
template.config('base', '');
template.config('extname', '.html');
// template.config('compress', true);

// 注册help
template.helper('Date', Date);
template.helper('parseFloat', parseFloat);
template.helper('parseInt', parseInt);
template.helper('Math', Math);

template.helper('dateFormat', dateFormat);
template.helper('dateElapsed', dateElapsed);


module.exports = template;

/**
 * 格式化时间
 * @param  {string} str  格式化的样式
 * @param  {number|Date|undefined} date 时间缀，时间对象，空
 * @return {string}      结果
 */
function dateFormat(str, date) {
    var getTime;
    var key;

    if (date) {
        if (!(date instanceof Date)) {
            date = new Date(parseInt(date, 10));
        }
    }
    else {
        date = new Date();
    }

    getTime = {
        "M+": date.getMonth() + 1,
        "d+": date.getDate(),
        "h+": date.getHours() % 12 == 0 ? 12 : date.getHours() % 12,
        "H+": date.getHours(),
        "m+": date.getMinutes(),
        "s+": date.getSeconds()
    };

    if (/(y+)/i.test(str)) {
        str = str.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (key in getTime) {
        if (new RegExp("(" + key + ")").test(str)) {
            str = str.replace(RegExp.$1, (RegExp.$1.length == 1) ? (getTime[key]) : (("00" + getTime[key]).substr(("" + getTime[key]).length)));
        }
    }
    return str;
};

/**
 * 美化时间缀
 * @param  {number} time 时间缀，13位
 * @return {string}      结果
 */
function dateElapsed(time) {
    var past = Math.round(new Date().getTime() - time);
    var result;
    if (past < 10) {
        result = '刚刚';
    }
    else if (past < 60) {
        result = Math.round(past) + "秒前";
    }
    else if (past < 3600) {
        result = Math.round(past / 60) + "分钟前";
    }
    else if (past < 86400) {
        result = Math.round(past / 3600) + "小时前";
    }
    else {
        result = dateFormat('yyyy-MM-dd HH:mm', time);
    }
    return result;
};
