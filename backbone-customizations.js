(function(){

  // customizations to Backbone
  
  // the counters used when delayed synchronization is used
  Backbone.outerCounter = 0;
  Backbone.innerCounter = 0;

  // time to delay sync
  Backbone.delayedTime = 1000;
  
  // flag which indicates if the request is in a delayed mode
  Backbone.delaying = false;

  // represents cache model used during delayed request
  Backbone.cachedModel = {};

  // cache current sync
  Backbone._sync = Backbone.sync;
  
  // add support for requests with delay
  Backbone.sync = function(method, model, success, error, delayed) {
    if (delayed || Backbone.delaying == true) {
      Backbone.outerCounter += 1;
      // extend cachedModel with keys from model
      $.extend(true, Backbone.cachedModel, model);
      Backbone.delaying = true;
      // wait for last event before saving
      setTimeout(function(){
        Backbone.innerCounter += 1;
        if (Backbone.innerCounter == Backbone.outerCounter) {
          Backbone._sync(method, Backbone.cachedModel, success, error);
          // reset counters and flags
          Backbone.outerCounter = 0;
          Backbone.innerCounter = 0;          
          Backbone.delaying = false;
          Backbone.cachedModel = {};
        }
      }, Backbone.delayedTime);
    }
    else {
      Backbone._sync(method, model, success, error);
      Backbone.outerCounter = 0;
    }
  };
  
  // monkey patched Backbone.Model and add additional functionality
  Backbone.Model = Backbone.Model.extend({

    // syncs only passed attributes intead of whole model.
    saveAttrs: function(attrs, options) {
     
      attrs   || (attrs = {});
      options || (options = {});
      if (!this.set(attrs, options)) return false;
      var model = this;
      // success callback
      var success = function(resp) {
        if (!model.set(model.parse(resp), options)) return false;
        if (options.success) options.success(model, resp);
      };
      // error callback
      var error = options.error && _.bind(options.error, null, model); 
      // create simple model expected by Backbone.sync
      var tmpModel = {attributes:attrs, url:model.url, toJSON:model.toJSON, id:model.id};
      Backbone.sync("update", tmpModel, success, error, options.delayed);
      return this;
    }
  });
})();
