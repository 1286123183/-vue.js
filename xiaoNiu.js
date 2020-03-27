/**
 *
 * 相当于vue的构造函数
 * @class XiaoNiu
 */
class XiaoNiu{
   constructor(options){
      this.$options = options;
      let data = this._data = this.$options.data;
      // 遍历data中的数据
      Object.keys(data).forEach((key)=>{
        
         this._proxy(key)
      })
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

}
