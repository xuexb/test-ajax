<%if(data.desc){%>
# <%=data.desc%> #
<%}%>
## URL ##
[<%=data.url%>](<%=data.url%>)

## 返回值格式 ##
<%=data.dataType%>

## HTTP请求方式 ##
<%=data.method%>

## 请求参数 ##

<%if(data.param && data.param.length){%>
    
参数名 | 必选 | 类型及范围 | 说明
--- | --- | --- | --- <%data.param.forEach(function(val,index){%>
<%=val.name%> | <%if(val.required === '1'){%>true<%}else{%>false<%}%> | <%=val.type%> | <%=val.desc||'无'%><%});%>
<% }else{ %>
无
<% }%>

<%if(data.resdata){%>
## 返回值 ##

<%for(var key in data.resdata){%>

### <%=data.resdata[key].name%> ###

```<%if(data.dataType === 'jsonp'){%>json<%}else{%><%=data.dataType%><%}%>
<%==data.resdata[key].data%>
```
<%}%>
<%}%>