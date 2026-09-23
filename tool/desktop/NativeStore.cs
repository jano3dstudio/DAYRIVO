using System;
using System.IO;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.Web.Script.Serialization;
namespace Jano.AppKit {
[ComVisible(true), ClassInterface(ClassInterfaceType.AutoDual)]
public class NativeStore {
 readonly string root;
 public NativeStore(string directory){root=directory;Directory.CreateDirectory(root);}
 string Slot(string key){
  if(key=="jsOfficeWeek_v1")return Path.Combine(root,"planner.json");
  if(key=="jsOfficeWeek_v1_beforeRestore")return Path.Combine(root,"before-import.json");
  if(key=="jsOfficeWeek_v1_beforeReset")return Path.Combine(root,"before-reset.json");
  throw new ArgumentException("Unbekannter Speicherbereich / Unknown storage key");
 }
 public string Read(string key){string file=Slot(key);return File.Exists(file)?File.ReadAllText(file,Encoding.UTF8):null;}
 public bool Save(string key,string json){
  string file=Slot(key),tmp=file+".tmp";
  if(key=="jsOfficeWeek_v1")Validate(json);
  else if(json==null||json.Length>20*1024*1024)throw new ArgumentException("Snapshot fehlt oder ist zu gross / Missing or oversized snapshot");
  if(File.Exists(file)&&File.ReadAllText(file,Encoding.UTF8)==json)return true;
  if(key=="jsOfficeWeek_v1"&&File.Exists(file)){
   string daily=Path.Combine(root,"backups","daily-"+DateTime.Now.ToString("yyyy-MM-dd")+".json");Directory.CreateDirectory(Path.GetDirectoryName(daily));
   if(!File.Exists(daily))File.Copy(file,daily);
  }
  byte[] bytes=new UTF8Encoding(false).GetBytes(json);
  using(var stream=new FileStream(tmp,FileMode.Create,FileAccess.Write,FileShare.None)){stream.Write(bytes,0,bytes.Length);stream.Flush(true);}
  if(File.Exists(file))File.Replace(tmp,file,file+".previous",true);else File.Move(tmp,file);
  return true;
 }
 public bool Remove(string key){if(key=="jsOfficeWeek_v1")throw new InvalidOperationException("Plan nur ueber Settings zuruecksetzen / Reset the plan in Settings");string file=Slot(key);if(File.Exists(file))File.Move(file,file+".removed-"+Guid.NewGuid().ToString("N"));return true;}
 public string Backup(){string json=Read("jsOfficeWeek_v1");Validate(json);string directory=Path.Combine(root,"backups");Directory.CreateDirectory(directory);string file=Path.Combine(directory,"dayrivo-"+DateTime.Now.ToString("yyyyMMdd-HHmmss")+"-"+Guid.NewGuid().ToString("N").Substring(0,6)+".json");File.WriteAllText(file,json,new UTF8Encoding(false));return file;}
 internal static void Validate(string json){
  if(json==null||json.Length>20*1024*1024)throw new ArgumentException("Plan fehlt oder ist zu gross / Missing or oversized plan");
  var serializer=new JavaScriptSerializer{MaxJsonLength=22*1024*1024,RecursionLimit=150};
  var value=serializer.DeserializeObject(json) as Dictionary<string,object>;
  if(value==null||!value.ContainsKey("version")||Convert.ToInt32(value["version"])!=1||!value.ContainsKey("weeks")||!(value["weeks"] is Dictionary<string,object>)||!value.ContainsKey("settings"))throw new ArgumentException("Ungueltiger Plan / Invalid plan");
 }
}
}
