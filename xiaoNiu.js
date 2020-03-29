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

/*
   Compile类
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
         }
         
      })
   };

   compileText(node,key){
      this.text(node,key);
   };

   text(node,key){
      this.binding(node,key,"text");
   };
   html(node,key){
      this.binding(node,key,"html")
   }
   
   binding(node,key,dir){
      let updateFn = updateUtil[dir+"Update"];
      updateFn && updateFn(node,otherUtil.getVMVal(this.$vm,key));
   };
   compileEvent(node,vm,dirName,attrValue){
      vm = vm.$options;
      let typeofEvnent = dirName.split(":")[1],
          eventCb = vm.methods && vm.methods[attrValue];
      if(typeofEvnent&&eventCb){
         node.addEventListener(typeofEvnent,eventCb.bind(vm),false);
      }
   }
   
}

/*
   存放杂七杂八的工具对象
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
   htmlUpdate(node,value){
      node.innerHTML = typeof value == "undefined" ? "" : value;
   }
};