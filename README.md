# js-code-renderer
美化JavaScript代码在浏览器的展示

# 快速开始
## 1. install
```base
npm install js-code-renderer

```

## 2. 使用

### index.js
```javascript
import { CodeRenderer } from 'js-code-renderer';

let renderBtn = document.querySelector('#render'); 
let codeArea = document.querySelector('#code');
let codeSnipet = document.querySelector('#code-snipet');
let ul = null; 

renderBtn.addEventListener('click', function() {
    if (ul) {
        ul.parentNode.removeChild(ul);
        ul = null;
    }
    doRender(codeArea.value) 
})

//展示
function doRender(code) {
    if (!code) return;

    // renderResult 为一个二元数组
    let renderResult = new CodeRenderer(code).render();
    ul = document.createElement('ul');

    renderResult.forEach(nodeRow => {
        let li = document.createElement('li');
        nodeRow.forEach(node => {
            let span = document.createElement('span');
            span.innerHTML = node.text.replace(/ /g, '&nbsp;');// 转换空格符
            if (node.style) {
                span.style.color = node.style.color;
            }
            li.appendChild(span)
        });
        ul.appendChild(li)
    }); 

    codeSnipet.appendChild(ul)
}

```
### index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        ul {
            list-style: none;
        }
        li {
            height: 22px;
            line-height: 22px;
        }
        #code-snipet {
            background-color: #1e1e1e;
            font-family: Consolas, 'Courier New', monospace;/*使用等宽字体*/
            color: #d4d4d4;
        }
    </style>
</head>
<body>
    <div class="js-code-renderer-demo">
        <h1>把代码粘贴到该输入框</h1>
        <textarea  id="code"></textarea>
        <button id="render">渲染</button>
        <div id="code-snipet">
            <ul></ul>
        </div>
    </div>
</body>
</html>
```

##demo代码地址
[https://github.com/nicholasking900816/js-code-renderer-demo](https://github.com/nicholasking900816/js-code-renderer-demo)