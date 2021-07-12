class Observer {
    constructor(data) {
        this.data = data;

        this.observe(this.data);
    }
    observe(data) {
        if (data && typeof data == "object") {
            Object.keys(data).forEach(key => {
                this.defineReactive(data, key, data[key]);
            });
        }
    }
    // 对于 data 来说，如果是非 object 类型的成员，就直接劫持属性
    // 否则递归一直到普通值
    defineReactive(data, key, value) {
        this.observe(value);
        // 定义依赖收集器， 然后每次调用 get 的时候（也就是在 compile 的时候，调用 getValue 的时候会调用 get）
        // 此时，从 compiler 那里获取 node 和 expr。 即观察者对象
        // 对该变量（或者 从 compiler 看来是 expr ）的全部依赖 对象

        // 闭包引用 dep
        const dep = new Dep();

        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false,
            get: () => {
                if (Dep.target) {
                    dep.addWatcher(Dep.target);
                }
                console.log(dep);
                return value;
            },
            // 这里面必须要使用 箭头函数,从而使得 this 指向 Observer.否则是 data
            set: (newValue) => {
                // 如果用户赋值了一个 object 变量，就需要对新值进行监听
                this.observe(newValue);
                if (newValue != value) {
                    value = newValue;
                }
                dep.notify();
            }
        });
    }
}

class Watcher {
    constructor(data, node, expr, callback) {
        this.data = data;
        this.node = node;
        this.expr = expr;
        this.callback = callback;

        this.oldValue = this.getOldValue();
    }
    getValue(expr, data) {
        if (expr.indexOf("{{") > -1) {
            return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
                return this.getValue(args[1], this.data);
            });
        } else {
            return expr.split(".").reduce((value, field) => {
                return value[field];
            }, data);
        }
    }
    getOldValue() {
        // 将当前的 watcher 绑到 Dep 下面。
        Dep.target = this;
        // 取值，会触发劫持的 get 方法
        let value = this.getValue(this.expr, this.data);
        Dep.target = null;
        return value;
    }
    update() {
        let value = this.getValue(this.expr, this.data);
        this.callback(value);
    }
}

class Dep {
    constructor(node, expr) {
        this.watcher = [];
        // this.oldValue = this.getOldValue();
    }
    // getOldValue() {
    //     return 
    // }
    addWatcher(watcher) {
        this.watcher.push(watcher);
    }
    notify() {
        this.watcher.forEach(w => {
            w.update();
        });
    }
}

module.exports = {
    Observer,
    Watcher,
    Dep
};