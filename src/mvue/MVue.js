const {Observer, Watcher, Dep} = require("./Observer");

class MVue {
    constructor(options) {
        this.$options = options;
        this.$data = options.data;
        if (typeof this.$data == 'function') {
            this.$data = this.$data();
        }
        this.$el = options.el;

        new Observer(this.$data);
        new Compiler(this.$el, this);
    }
}

class Compiler {
    constructor(el, vm) {
        this.vm = vm;
        const node = this.isElementNode(el) ? el : document.querySelector(el);
        const fragments = this.node2Fragment(node);
        this.Compile(fragments);
        node.appendChild(fragments);
    }
    getValue(expr, data) {
        return expr.split(".").reduce((value, field) => {
            return value[field];
        }, data);
    }
    setValue(expr, newValue, data) {
        let findObj = data;
        const fields = expr.split(".");
        for(let i = 0 ; i < fields.length - 1; i++){
            findObj = findObj[fields[i]];
        }
        findObj[fields[fields.length - 1]] = newValue;

        // return expr.split(".").reduce((value, field) => {
        //     return value[field];
        // }, data);
    }
    compute() {
        // 目前只能支持 变量绑定，不支持 js 表达式
        return {
            text: (expr, eventName) => {
                const viewData = this.getValue(expr, this.vm.$data);
                return viewData;
            },
            html: (expr, eventName) => {
                const viewData = this.getValue(expr, this.vm.$data);
                return viewData;
            },
            model: (expr, eventName) => {
                const viewData = this.getValue(expr, this.vm.$data);
                return viewData;
            },
            bind: (expr, eventName) => {
                const viewData = this.getValue(expr, this.vm.$data);
                return viewData;
            },
            on: (expr, eventName) => {
                return this.vm.$options.methods[expr];
            },
            textExpr: (expr) => {
                return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
                    return this.getValue(args[1], this.vm.$data);
                });
            }
        };
    }
    updaters() {
        return {
            text: (node, value) => {
                node.textContent = value;
            },
            html: (node, value) => {
                node.innerHTML = value
            },
            model: (node, value) => {
                node.value = value;
            },
            bind: (node, value, eventName) => {
                node.setAttribute(eventName, value);
            },
            on: (node, value, eventName) => {
                node.addEventListener(eventName, value.bind(this.vm));
            }
        };
        // 目前只能支持 变量绑定，不支持 js 表达式
    }
    Compile(fragments) {
        // 对 frag 里面的元素进行编译，根据类型
        fragments.childNodes.forEach(node => {
            if (node.nodeType == 1) {
                // 元素节点
                // 查找是否拥有指令、
                const attributes = node.attributes;
                [...attributes].forEach(attr => {
                    // 检测如果是 v- 指令，就使用指定的编译方法
                    const { name, value } = attr;
                    let directive, directiveName, eventName, viewData;
                    // 判断分支里面仅仅做 获取 事件名 和 属性值 的功能，细节功能在下一级别
                    if (this.isDirective(name)) {
                        [, directive] = name.split("v-");
                        // 可能拥有事件名称，例如 v-on:click
                        [directiveName, eventName] = directive.split(":");
                        // 不能统一在这里面使用 getValue，因为属性值不仅仅是 data 数据绑定，还有 on 的 来自与 methods 里面的函数名字或者的 js 表达式
                        // 统一传到 updater 里面 分别 处理   viewData = this.getValue(value, this.vm.$data);

                        console.log(directiveName, eventName, value);

                        // 在这里创建 观察者， 获取 监听的 expr 和 更新回调函数
                        // 由于在 构造函数里面将 watcher 挂到 target，所以不会被垃圾回收
                        new Watcher(this.vm.$data, node, value, (newValue) => {
                            this.updaters()[directiveName](node, newValue, eventName);
                        });

                        // 在这步，会调用在 observer 里面劫持定义的 get 方法。
                        viewData = this.compute()[directiveName](value, eventName);
                        this.updaters()[directiveName](node, viewData, eventName);
                        this.clearDirective(node, name);

                        // 如果是输入类型控件，需要进行双向绑定
                        if (directiveName == "model") {
                            node.addEventListener("input", (event) => {
                                const newValue = event.target.value;
                                this.setValue(value, newValue, this.vm.$data);
                            });
                        }
                    } else if (this.isAtDirective(name)) {
                        [, eventName] = name.split("@");
                        // 可能拥有事件名称，例如 v-on:click
                        directiveName = "on";

                        // console.log(directiveName, eventName, value);

                        viewData = this.compute()[directiveName](value, eventName);
                        this.updaters()[directiveName](node, viewData, eventName);
                        this.clearDirective(node, name);
                    } else if (this.isBindDirective(name)) {
                        [, eventName] = name.split(":");
                        // 可能拥有事件名称，例如 v-on:click
                        directiveName = "bind";

                        // console.log(directiveName, eventName, value);
                        new Watcher(this.vm.$data, node, value, (newValue) => {
                            this.updaters()[directiveName](node, newValue, eventName);
                        });

                        viewData = this.compute()[directiveName](value, eventName);
                        this.updaters()[directiveName](node, viewData, eventName);
                        this.clearDirective(node, name);
                    }
                    // 是正常属性，不做处理
                });
            } else if (node.nodeType == 3) {
                // 文本节点
                let viewData = node.textContent;
                // 查找是否包含差值表达式
                if (viewData.indexOf("{{") >= 0) {
                    new Watcher(this.vm.$data, node, viewData, (newValue) => {
                        // TODO 需要是 textExpr 类型的计算
                        // this.updaters()["text"](node, newValue);
                    });

                    viewData = this.compute()["textExpr"](viewData);
                    this.updaters()["text"](node, viewData);
                }
            }
        });
    }
    node2Fragment(node) {
        const fragments = document.createDocumentFragment();
        let firstChild;

        while (firstChild = node.firstChild) {
            fragments.appendChild(firstChild);
        }
        return fragments;
    }
    isElementNode(node) {
        return node.nodeType == 1;
    }
    isDirective(directiveName) {
        return directiveName.startsWith("v-");
    }
    isAtDirective(directiveName) {
        return directiveName.startsWith("@");
    }
    isBindDirective(directiveName) {
        return directiveName.startsWith(":");
    }
    clearDirective(node, attrName) {
        node.removeAttribute(attrName);
    }
}



window.MVue = MVue