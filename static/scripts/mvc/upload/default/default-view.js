define(["utils/utils","mvc/upload/upload-model","mvc/upload/default/default-row","mvc/upload/upload-ftp","mvc/ui/ui-popover","mvc/ui/ui-select","mvc/ui/ui-misc","utils/uploadbox"],function(a,b,c,d,e,f,g){return Backbone.View.extend({select_extension:null,select_genome:null,uploadbox:null,upload_size:0,collection:new b.Collection,ftp:null,counter:{announce:0,success:0,error:0,running:0,reset:function(){this.announce=this.success=this.error=this.running=0}},initialize:function(a){this.app=a,this.options=a.options,this.list_extensions=a.list_extensions,this.list_genomes=a.list_genomes,this.ui_button=a.ui_button,this.ftp_upload_site=a.currentFtp();var b=this;this.setElement(this._template()),this.btnLocal=new g.Button({id:"btn-local",title:"Choose local file",onclick:function(){b.uploadbox.select()},icon:"fa fa-laptop"}),this.btnFtp=new g.Button({id:"btn-ftp",title:"Choose FTP file",onclick:function(){b._eventFtp()},icon:"fa fa-folder-open-o"}),this.btnCreate=new g.Button({id:"btn-new",title:"Paste/Fetch data",onclick:function(){b._eventCreate()},icon:"fa fa-edit"}),this.btnStart=new g.Button({id:"btn-start",title:"Start",onclick:function(){b._eventStart()}}),this.btnStop=new g.Button({id:"btn-stop",title:"Pause",onclick:function(){b._eventStop()}}),this.btnReset=new g.Button({id:"btn-reset",title:"Reset",onclick:function(){b._eventReset()}}),this.btnClose=new g.Button({id:"btn-close",title:"Close",onclick:function(){b.app.modal.hide()}});var c=[this.btnLocal,this.btnFtp,this.btnCreate,this.btnStop,this.btnReset,this.btnStart,this.btnClose];for(var d in c)this.$("#upload-buttons").prepend(c[d].$el);var b=this;this.uploadbox=this.$("#upload-box").uploadbox({url:this.app.options.nginx_upload_path,announce:function(a,c){b._eventAnnounce(a,c)},initialize:function(a){return b.app.toData([b.collection.get(a)],b.history_id)},progress:function(a,c){b._eventProgress(a,c)},success:function(a,c){b._eventSuccess(a,c)},error:function(a,c){b._eventError(a,c)},complete:function(){b._eventComplete()},ondragover:function(){b.$(".upload-box").addClass("highlight")},ondragleave:function(){b.$(".upload-box").removeClass("highlight")}}),this.ftp=new e.View({title:"FTP files",container:this.btnFtp.$el}),this.select_extension=new f.View({css:"footer-selection",container:this.$("#footer-extension"),data:_.filter(this.list_extensions,function(a){return!a.composite_files}),value:this.options.default_extension,onchange:function(a){b.updateExtension(a)}}),b.$("#footer-extension-info").on("click",function(a){b.showExtensionInfo({$el:$(a.target),title:b.select_extension.text(),extension:b.select_extension.value(),placement:"top"})}).on("mousedown",function(a){a.preventDefault()}),this.select_genome=new f.View({css:"footer-selection",container:this.$("#footer-genome"),data:this.list_genomes,value:this.options.default_genome,onchange:function(a){b.updateGenome(a)}}),this.collection.on("remove",function(a){b._eventRemove(a)}),this._updateScreen()},_eventAnnounce:function(a,d){this.counter.announce++;var e=new b.Model({id:a,file_name:d.name,file_size:d.size,file_mode:d.mode||"local",file_path:d.path,file_data:d});this.collection.add(e);var f=new c(this,{model:e});this.$("#upload-table > tbody:first").append(f.$el),this._updateScreen(),f.render()},_eventProgress:function(a,b){var c=this.collection.get(a);c.set("percentage",b),this.ui_button.set("percentage",this._uploadPercentage(b,c.get("file_size")))},_eventSuccess:function(a){var b=this.collection.get(a);b.set("percentage",100),b.set("status","success"),this.ui_button.set("percentage",this._uploadPercentage(100,b.get("file_size"))),this.upload_completed+=100*b.get("file_size"),this.counter.announce--,this.counter.success++,this._updateScreen(),Galaxy.currHistoryPanel.refreshContents()},_eventError:function(a,b){var c=this.collection.get(a);c.set("percentage",100),c.set("status","error"),c.set("info",b),this.ui_button.set("percentage",this._uploadPercentage(100,c.get("file_size"))),this.ui_button.set("status","danger"),this.upload_completed+=100*c.get("file_size"),this.counter.announce--,this.counter.error++,this._updateScreen()},_eventComplete:function(){this.collection.each(function(a){"queued"==a.get("status")&&a.set("status","init")}),this.counter.running=0,this._updateScreen()},_eventRemove:function(a){var b=a.get("status");"success"==b?this.counter.success--:"error"==b?this.counter.error--:this.counter.announce--,this.uploadbox.remove(a.id),this._updateScreen()},showExtensionInfo:function(a){var b=this,c=a.$el,d=a.extension,f=a.title,g=_.findWhere(b.list_extensions,{id:d});this.extension_popup&&this.extension_popup.remove(),this.extension_popup=new e.View({placement:a.placement||"bottom",container:c,destroy:!0}),this.extension_popup.title(f),this.extension_popup.empty(),this.extension_popup.append(this._templateDescription(g)),this.extension_popup.show()},_eventFtp:function(){if(this.ftp.visible)this.ftp.hide();else{this.ftp.empty();var a=this;this.ftp.append(new d({collection:this.collection,ftp_upload_site:this.ftp_upload_site,onadd:function(b){a.uploadbox.add([{mode:"ftp",name:b.path,size:b.size,path:b.path}])},onremove:function(b){a.collection.remove(b)}}).$el),this.ftp.show()}},_eventCreate:function(){this.uploadbox.add([{name:"New File",size:0,mode:"new"}])},_eventStart:function(){if(!(0==this.counter.announce||this.counter.running>0)){var a=this;this.upload_size=0,this.upload_completed=0,this.collection.each(function(b){"init"==b.get("status")&&(b.set("status","queued"),a.upload_size+=b.get("file_size"))}),this.ui_button.set("percentage",0),this.ui_button.set("status","success"),this.counter.running=this.counter.announce,this.history_id=this.app.currentHistory(),this.uploadbox.start(),this._updateScreen()}},_eventStop:function(){this.counter.running>0&&(this.ui_button.set("status","info"),$("#upload-info").html("Queue will pause after completing the current file..."),this.uploadbox.stop())},_eventReset:function(){0==this.counter.running&&(this.collection.reset(),this.counter.reset(),this.uploadbox.reset(),this.select_extension.value(this.options.default_extension),this.select_genome.value(this.options.default_genome),this.ui_button.set("percentage",0),this._updateScreen())},updateExtension:function(a,b){var c=this;this.collection.each(function(d){"init"!=d.get("status")||d.get("extension")!=c.options.default_extension&&b||d.set("extension",a)})},updateGenome:function(a,b){var c=this;this.collection.each(function(d){"init"!=d.get("status")||d.get("genome")!=c.options.default_genome&&b||d.set("genome",a)})},_updateScreen:function(){message=0==this.counter.announce?this.uploadbox.compatible()?"&nbsp;":"Browser does not support Drag & Drop. Try Firefox 4+, Chrome 7+, IE 10+, Opera 12+ or Safari 6+.":0==this.counter.running?"You added "+this.counter.announce+" file(s) to the queue. Add more files or click 'Start' to proceed.":"Please wait..."+this.counter.announce+" out of "+this.counter.running+" remaining.",this.$("#upload-info").html(message),0==this.counter.running&&this.counter.announce+this.counter.success+this.counter.error>0?this.btnReset.enable():this.btnReset.disable(),0==this.counter.running&&this.counter.announce>0?(this.btnStart.enable(),this.btnStart.$el.addClass("btn-primary")):(this.btnStart.disable(),this.btnStart.$el.removeClass("btn-primary")),this.counter.running>0?this.btnStop.enable():this.btnStop.disable(),0==this.counter.running?(this.btnLocal.enable(),this.btnFtp.enable(),this.btnCreate.enable()):(this.btnLocal.disable(),this.btnFtp.disable(),this.btnCreate.disable()),this.ftp_upload_site?this.btnFtp.$el.show():this.btnFtp.$el.hide(),this.counter.announce+this.counter.success+this.counter.error>0?(this.$("#upload-table").show(),this.$(".upload-helper").hide()):(this.$("#upload-table").hide(),this.$(".upload-helper").show())},_uploadPercentage:function(a,b){return(this.upload_completed+a*b)/this.upload_size},_templateDescription:function(a){if(a.description){var b=a.description;return a.description_url&&(b+='&nbsp;(<a href="'+a.description_url+'" target="_blank">read more</a>)'),b}return"There is no description available for this file extension."},_template:function(){return'<div class="upload-view-default"><div class="upload-top"><h6 id="upload-info" class="upload-info"/></div><div id="upload-box" class="upload-box"><div class="upload-helper"><i class="fa fa-files-o"/>Drop files here</div><table id="upload-table" class="ui-table-striped" style="display: none;"><thead><tr><th>Name</th><th>Size</th><th>Type</th><th>Genome</th><th>Settings</th><th>Status</th><th/></tr></thead><tbody/></table></div><div id="upload-footer" class="upload-footer"><span class="footer-title">Type (set all):</span><span id="footer-extension"/><span id="footer-extension-info" class="upload-icon-button fa fa-search"/> <span class="footer-title">Genome (set all):</span><span id="footer-genome"/></div><div id="upload-buttons" class="upload-buttons"/></div>'}})});
//# sourceMappingURL=../../../../maps/mvc/upload/default/default-view.js.map