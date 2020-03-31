/**
 * XiaoNiu类
 * 入口，相当于vue的构造函数
 * @class XiaoNiu
 */
class XiaoNiu{
   constructor(options){
      this.$options = options;
      let data = this._data = this.$options.data;
      // 遍历data中的数据
      Object.keys(data).forEach((key)=>{
         this._proxy(key)
      });
      observe(data,this);
      this.$compile = new Compile(this.$options.el || document.body,this);
   };

  /**
    *
    * 实现数据代理
    * @param {*} keys： 要代理的属性名
    */
   _proxy(keys){
      Object.defineProperty(this,keys,{
         configurable:false,
         enumerable: true,
         get(){
            return this._data[keys];
         },
         set(newValue){
            this._data[keys] = newValue;
         }
      })
   }

};

 
/**
 *
 * 编译对象
 * @class Compile
 */
class Compile{
   constructor(el,vm){
      this.$el = otherUtil.isElementNode(el) ? el : document.querySelector(el);
      this.$vm = vm;
      if(this.$el){
         this.$fragment = this.node2Fragment(this.$el);
         this.init();
         this.$el.appendChild(this.$fragment);
      }
   }

   /**
    *
    * 转换子节点
    * @param {*} el
    * @returns
    * @memberof Compile
    */
   node2Fragment(el){
      let fragMent = document.createDocumentFragment(),
          child;
      while(child = el.firstChild){
         fragMent.appendChild(child);
      };
      return fragMent;
   };

   /**
    *
    * 初始化
    * @memberof Compile
    */
   init(){
      console.log(this.$fragment)
      this.compileNode(this.$fragment);
   };

   /**
    *
    * 编译
    * @memberof Compile
    */
   compileNode(fr){
      let childNodes = fr.childNodes;
      Array.from(childNodes).forEach((node)=>{
         let text = node.textContent,
             reg = /^\{\{(.*)\}\}$/;
            if(otherUtil.isElementNode(node)){
               this.compile(node);
            }else if(otherUtil.isTextNode(node) && reg.test(text)){
               this.compileText(node,RegExp.$1);
            };
            if(node.childNodes && node.childNodes){
               this.compileNode(node);
            }
      });
   };

   /**
    *
    * 编译指令
    * @param {*} node
    * @memberof Compile
    */
   compile(node){
      let attrs = node.attributes;
      Array.from(attrs).forEach((attr)=>{
         let attrName = attr.name;
         if(otherUtil.isDirective(attrName)){
            let attrValue = attr.value,
                dirName = attrName.slice(2);
            if(otherUtil.isEventDirective(dirName)){
               this.compileEvent(node,this.$vm,dirName,attrValue);
            }else{
               this[dirName] && this[dirName](node,attrValue);
            }
            node.removeAttribute(attrName);
         }
      })
   };

   /**
    *
    * 大括号表达式
    * @param {*} node
    * @param {*} key
    * @memberof Compile
    */
   compileText(node,key){
      this.text(node,key);
   };

   /**
    *
    * v-text、大括号表达式
    * @param {*} node
    * @param {*} key
    * @memberof Compile
    */
   text(node,key){
      this.binding(node,key,"text");
   };
   
   /**
    *
    * v-html
    * @param {*} node
    * @param {*} key
    * @memberof Compile
    */
   html(node,key){
      this.binding(node,key,"html")
   };

   /**
    *
    * v-model
    * @param {*} node
    * @param {*} key
    * @memberof Compile
    */
   model(node,key){
      this.binding(node,key,"model");
      let val = this._getValue(this.$vm,key);
      node.addEventListener("input",(e)=>{ 
         let newVal = e.target.value;
         if(val === newVal){
            return;
         };
         this._setVal(this.$vm,key,newVal);
         val = newVal;
      });
   };
   
   /**
    *
    * 绑定
    * @param {*} node
    * @param {*} key
    * @param {*} dir
    * @memberof Compile
    */
   binding(node,key,dir){
      let updateFn = updateUtil[dir+"Update"];
      updateFn && updateFn(node,otherUtil.getVMVal(this.$vm,key));

      new Watcher(this.$vm,key,(value,oldVale)=>{
         updateFn && updateFn(node,value,oldVale);
      })
   };
   /**
    *
    * 绑定事件指令
    * @param {*} node
    * @param {*} vm
    * @param {*} dirName
    * @param {*} attrValue
    * @memberof Compile
    */
   compileEvent(node,vm,dirName,attrValue){
      console.log(vm)
      // vm = vm.$options;
      let typeofEvnent = dirName.split(":")[1],
          eventCb = vm.$options.methods && vm.$options.methods[attrValue];
      if(typeofEvnent&&eventCb){
         node.addEventListener(typeofEvnent,eventCb.bind(vm),false);
      }
   };

   /**
    *
    * 获取表达式对应的值
    * @param {*} vm
    * @param {*} key
    * @returns
    * @memberof Compile
    */
   _getValue(vm,key){
      console.log(key)
      let value = vm._data;
          key = key.split(".");
      key.forEach((k)=>{
         value = value[k];
      })
      return value;
   };

   /**
    *
    * 设置表达式对应的值
    * @param {*} vm
    * @param {*} exp
    * @param {*} value
    * @memberof Compile
    */
   _setVal(vm,exp,value){
      let val = vm._data;
          exp = exp.split(".");
      exp.forEach((k,i)=>{
         if(i < exp.length-1){
            val = val[k];
         }else{
            val[k] = value;
         }
      })

   };
}
   


/*
   存放工具的对象
*/ 
let otherUtil = {
   isElementNode(node){
      return node.nodeType == 1;
   },

   isTextNode(node){
      return node.nodeType == 3;
   },
   isDirective(attr){
      return attr.startsWith("v-");
   },
   isEventDirective(attr){
      return attr.startsWith("on");
   },
   getVMVal(vm,key){
      let value = vm._data;
      key = key.split(".");
      key.forEach((k)=>{
         value = value[k];
      });
      return value;
   }
   
};

//更新 
let updateUtil = { 
   /**
    *
    * 解析大括号表达式、v-text
    * @param {*} node
    * @param {*} value
    */
   textUpdate(node,value){
      node.textContent = typeof value == "undefined" ? "" : value;
   },
   /**
    *
    * v-html
    * @param {*} node
    * @param {*} value
    */
   htmlUpdate(node,value){
      node.innerHTML = typeof value == "undefined" ? "" : value;
   },

   /**
    *
    * v-model
    * @param {*} node
    * @param {*} value
    */
   modelUpdate(node,value){
      console.log(node,value);
      node.value = typeof value === "undefined"? "" : value;
   }
};

/**
 *
 * 被监视的属性是不是一个对象
 * @param {*} value
 * @returns
 */
function observe(value){
   if(!value || typeof value !== "object"){
      return;
   }
   return new Observer(value);
}

class Observer{
   constructor(data){
      this.data = data;
      this.start(data);
   };
   // 劫持数据
   start(data){
      Object.keys(data).forEach((key)=>{
         this.defineReactive(this.data,key,data[key]);
      })
   };
   // 劫持数据的方法
   defineReactive(data,key,val){
      let dep = new Dep(),
          childObj = observe(val);
      Object.defineProperty(data,key,{
         configurable:false,
         enumerable:true,
         get(){
            if(Dep.target){
               dep.depend();
            }
            return val;
         },
         set(newVal){
            if(newVal === val){
               return;
            }
            val = newVal;
            childObj = observe(val);
            dep.notify();
         }
      })
   }
};
// 发布
let id = 0;
class Dep{
   constructor(){
      this.id = id++;
      this.subs = [];
   };
   addSub(sub){
      this.subs.push(sub)
   };
   depend(){
      Dep.target.addDep(this);
   };
   notify(){
      this.subs.forEach((sub)=>{
         sub.update();
      })
   }
};
// 订阅
class Watcher{
   constructor(vm,exp,cb){
      this.vm = vm;
      this.exp = exp;
      this.cb = cb;
      this.depIds = {};
      this.value = this.get();
   };
   update(){
      this.run();
   };
   run(){
      let val = this.get(),
          oldVal = this.value;
      if(val !== oldVal){
         this.value = val;
         this.cb.call(this.vm,val,oldVal);
      }
   };
   addDep(dep){
      if(!this.depIds.hasOwnProperty(dep.id)){
         dep.addSub(this);
         this.depIds[dep.id] = dep;
      }
   };

   get(){
      Dep.target = this;
      let val = this.getVMVal();
      Dep.target = null;
      return val;
   };
   getVMVal(){
      let exp = this.exp.split(".");
      let val = this.vm._data;
      exp.forEach(key => {
         val = val[key];
      });
      return val;
   }
};