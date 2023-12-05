import React, { useState, useEffect, useRef } from "react";
import { fabric } from "fabric";
import { FabricJSCanvas, useFabricJSEditor } from "fabricjs-react";
import { appStore } from "@/zu_store/appStore";
import { useRouter } from "next/router";
import { common } from "@/components/Common";

const Canvas = (props) => {
  const { editor, onReady } = useFabricJSEditor();
  const router = useRouter();
  let filterdata = appStore((state) => state.filterCanvas);
  let selectCursor = appStore((state) => state.selectCursor);
  let drawData = appStore((state) => state.drawData);
  let editorData = appStore((state) => state.editorData);
  let activetab = appStore((state) => state.activetab);
  const [load, setload] = useState(false);
  let store1 = appStore((state) => state);
  let undoData = appStore((state) => state.undoData);
  let updateElemen = appStore((state) => state.updateElement);
  let [loading, setloading] = useState(false);
  const startDrawaing = useRef(null);
  const isDown = useRef(false);
  const line = useRef(null);
  const mousecursor = useRef(null);
  if (editor) {
    editor.canvas.setDimensions({
      width: parseInt(props.dimension.width),
      height: parseInt(props.dimension.height),
      left: 0,
      top: 0,
      objectCaching: false,
    });

    editor.canvas.selection = false;
    editor.canvas.isDrawingMode = false;
    editor.canvas.selectionLineWidth =  3;
    editor.canvas.transparentCorners = false;
    editor.canvas.preserveObjectStacking = true;
    editor.canvas.cornerSize = 50;
  }

  useEffect(() => {
    if(load==true)
    {
      window.addEventListener("keydown", handleKeyPress);
    }
  
  }, [load]);
  const handleKeyPress = (event) => {
    if (event.key === "Delete") {
      event.preventDefault();
      if (editor) {
        let objct = editor.canvas.getActiveObject();
        if (objct) {
          editor.canvas.remove(objct);
          store1.updateStoreData("activeElement", {
            id: "",
            element: "",
          });
        }
      }
    } else if (event.key === "ArrowLeft") { 
      let objct = editor.canvas.getActiveObject();
      if(objct)
      {
        moveSelected(objct,"left");
      }
      }else if (event.key === "ArrowRight"){
        let objct = editor.canvas.getActiveObject();
        if(objct)
        {
          moveSelected(objct,"right");
        }
      } else if (event.key === "ArrowUp"){
        let objct = editor.canvas.getActiveObject();
        if(objct)
        {
          moveSelected(objct,"ArrowUp");
        }
      }else if (event.key === "ArrowDown"){
        let objct = editor.canvas.getActiveObject();
        if(objct)
        {
          moveSelected(objct,"ArrowDown");
        }
      }
  };

  const moveSelected=(find,dir)=>{
  
    if(dir=="left")
    {
      if(find.left>0)
      {
      
        find.set({
          left :  find.left - 3
        })
        editor.canvas.renderAll()
      }
    }else if(dir=="right")
    {
      if(parseInt(find.left) < parseInt(props.dimension.width))
      {
        find.set({
          left :  find.left + 3
        })
        editor.canvas.renderAll()
      }
    } else if(dir =="ArrowUp"){
      if(find.top>0)
      {
        find.set({
          top :  find.top - 3
        })
        editor.canvas.renderAll()
      }
   
    } else  if(dir =="ArrowDown"){
      if(parseInt(find.top) < parseInt(props.dimension.height))
      {
      find.set({
        top :  find.top + 3
      })
      editor.canvas.renderAll()
    }
    }

  }
  useEffect(() => {
    if (editor != undefined && load == false && loading == false) {
      let textData = editorData.filter((d1) => d1.type == "textbox");
      let d1 = [];
      for (let i = 0; i < textData.length; i++) {
        d1.push(textData[i].fontFamily);
      }
      if (d1.length != 0) {
        let WebFont = require("webfontloader");
        WebFont.load({
          google: {
            families: d1,
          },
          active: () => {
            editor.canvas.loadFromJSON({ objects: editorData });
          },
        });
        setload(true);
      } else {
        
        editor.canvas.loadFromJSON({ objects: editorData });
        setload(true);
      }
      console.log("EditorReady")
    }
  }, [editor && editor.canvas]);

  useEffect(() => {
    if (editor && store1.save != 0) {
      let s = store1.save;
      store1.updateStoreData("save", 0);
      saveEditorData(s);
    }
  }, [store1.save]);

  useEffect(() => {
    if (updateElemen.status && editor) {
      let action = updateElemen.action;
      let objct = editor.canvas.getActiveObject();
      if (objct) {
        if (action == "clone") {
          let activeObjects = editor.canvas.getActiveObjects();
          let ele = {
            ...editorData.find((d1) => d1.id == activeObjects[0].id),
          };
          let d1 = [...editorData];
          activeObjects.forEach((obj) => {
            obj.clone((clone) => {
              let id = "id" + Math.random().toString(16).slice(2);
              editor.canvas.add(
                clone.set({
                  left: obj.aCoords.tl.x + 20,
                  top: obj.aCoords.tl.y + 20,
                  id: id,
                })
              );
              ele = {
                ...ele,
                left: obj.aCoords.tl.x + 20,
                top: obj.aCoords.tl.y + 20,
                id: id,
              };
              d1.push(ele);
            });
          });
          store1.updateStoreData("editorData", d1);
          editor.canvas.renderAll();
        }
        editor.canvas.discardActiveObject();
        editor.canvas.getObjects().forEach((obj) => {
          obj.set("active", false);
        });
        if (action == "front") {
          editor.canvas.bringToFront(objct);
        } else if (action == "back") {
          editor.canvas.sendToBack(objct);
        } else if (action == "backwards") {
          editor.canvas.sendBackwards(objct);
        } else if (action == "delete") {
          let d1 = editorData.filter((d1) => d1.id != objct.id);
          editor.canvas.remove(objct);
          store1.updateStoreData("activeElement", {
            id: "",
            element: "",
          });
          store1.updateStoreData("editorData", d1);
        } else {
          editor.canvas.bringForward(objct);
        }
      }
      store1.updateStoreData("activeElement", {
        id: "",
        element: "",
      });
      setTimeout(() => {
        editor.canvas.renderAll();
      }, 500);

      store1.updateStoreData("updateElement", {
        status: false,
        action: "",
      });
    }
  }, [updateElemen.status]);

  let saveEditorData = (s) => {
    let d1 = document.getElementById("SelectArrow");
    if (d1) {
      d1.click();
    }
    let objects = editor.canvas.toJSON(["id", "type","stype","nsrc"]);
    let name = "id" + Math.random().toString(16).slice(2);

    let data = {
      data: objects,
      target: router.query.id,
      action: "imageGenrate",
      dimenstions: props.dimension,
      filter: filterdata,
    };
    if (props.dimension.layout) {
      data.layout = props.dimension.layout;
    }
    if (s == 2) {
      data.publish = true;
    }
    if (store1.drawData?.bgColor) {
      data.bgColor = store1.drawData?.bgColor;
    }
    common.getAPI(
      {
        method: "PUT",
        url: "templates",
        data: data,
      },
      (resp) => {
        if (s == 2 && store1.userData.role == "User") {
          const imageUrl = process.env.S3_PATH + resp.url;

          fetch(imageUrl).then((response) => response.blob()).then((blob) => {
              const objectURL = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = objectURL;
              a.download = "image.jpg";
              a.style.display = "none";
              document.body.appendChild(a);
              a.click();
            });
        }
        store1.updateStoreData("save", false);
      }
    );
  };
  let getfilterStatus = (key, value = 0) => {
    let filtersImage = {
      Grayscale: new fabric.Image.filters.Grayscale(),
      Sepia: new fabric.Image.filters.Sepia(),
      Brightness: new fabric.Image.filters.Brightness({
        brightness: value / 100,
      }),
      Contrast: new fabric.Image.filters.Contrast({
        contrast: value / 100,
      }),
      HueRotation: new fabric.Image.filters.HueRotation({
        rotation: value / 100,
      }),
      Invert: new fabric.Image.filters.Invert(),
      Saturation: new fabric.Image.filters.Saturation({
        saturation: value,
      }),
      Noise: new fabric.Image.filters.Noise({
        noise: value,
      }),
      Blur: new fabric.Image.filters.Blur({
        blur: value / 100,
      }),

      Pixelate: new fabric.Image.filters.Pixelate({
        blocksize: value,
      }),
    };

    return filtersImage[key];
  };

  useEffect(() => {
    if (undoData.status == true && editor) {
      editor.canvas.clear();
      let current = undoData.data[undoData.currentPostion - 1];
      if (current == undefined) {
        return;
      }
      editor.canvas.loadFromJSON(current);
      undoData.status = false;
      store1.updateStoreData("undoData", undoData);
      store1.updateStoreData("editorData", current.objects);
    }
  }, [undoData]);

  useEffect(() => {
    if (editor && editor.canvas.getActiveObject()) {
      editor.canvas.discardActiveObject();
      editor.canvas.getObjects().forEach((obj) => {
        obj.set("active", false);
      });
    }
    if (editor) {
      let find = editor.canvas._objects.find((dat) => dat.id == "cursur");
      if (find && activetab != "pencil") {
        mousecursor.current = null;
        editor.canvas.remove(find);
        editor.canvas.renderAll();
      }

      if (activetab == "Design") {
        startDrawaing.current = true;
      } else {
        startDrawaing.current = false;
        if (activetab == "pencil") {
          editor.canvas.freeDrawingBrush.width = parseInt(drawData.size);
          editor.canvas.freeDrawingBrush.color = drawData.color;
        }
      }

      if (activetab == "Design" || activetab == "pencil") {
        editor.canvas.forEachObject((object) => {
          object.selectable = false;
        });

        editor.canvas.renderAll();
      } else {
        editor.canvas.forEachObject((object) => {
          object.selectable = true;
        });

        editor.canvas.renderAll();
      }
    }
  }, [activetab]);

  useEffect(() => {
    if (editor && editor.canvas && load) {
      if (drawData.type == "pencil" && activetab == "pencil") {
        editor.canvas.isDrawingMode = true;
        if (mousecursor.current == null) {
          mousecursor.current = new fabric.Circle({
            id: "cursur",
            radius: drawData.size,
            fill: drawData.color,
            originX: "center",
            originY: "center",
            selectable: false,
          });
          editor.canvas.add(mousecursor.current);
          editor.canvas.renderAll();
        } else {
          mousecursor.current.set({
            fill: drawData.color,
            radius: drawData.size,
          });
        }
        editor.canvas.freeDrawingBrush.width = parseInt(drawData.size);
        editor.canvas.freeDrawingBrush.color = drawData.color;
      } else {
        editor.canvas.isDrawingMode = false;
      }

      if (drawData.type == "pencil" && activetab == "pencil") {
        editor?.canvas.on({ "mouse:move": onMouseMove });
      } else {
        if (activetab == "Design" && startDrawaing.current == true) {
          editor?.canvas.on({ "mouse:down": onMouseDown1 });
          editor?.canvas.on({ "mouse:up": onDblClick1 });
          editor?.canvas.on({ "mouse:move": onMouseMove1 });
        } else {
          editor?.canvas.on({ "mouse:down": openSetting });
        }
      }
      editor?.canvas.on({ "object:modified": saveProcess });
      editor?.canvas.on("path:created", async (options) => {
        var drawnObject = options.path;

        drawnObject.set("id", "Draw" + Math.random());

        let dat = store1.editorData;

        dat.push(drawnObject);

        await store1.updateStoreData("editorData", dat);

        editor.canvas.isDrawingMode = true;
      });
    }
    return () => {
      editor?.canvas.off();
    };
  }, [activetab, drawData, load, editorData]);

  useEffect(() => {
    if (editor?.canvas) {
      updateEditor();
    }
  }, [store1]);

  const saveProcess = (e) => {
    if (undoData.status == false) {
      let currentState = editor.canvas.toJSON(["id", "type"]);
      if (parseInt(undoData.currentPostion) >= 10) {
        undoData.currentPostion = 10;
        undoData.data.shift();
      } else {
        undoData.currentPostion = parseInt(undoData.currentPostion) + 1;
      }
      if (undoData.data[parseInt(undoData.currentPostion) - 1] == undefined) {
        undoData.data.push(currentState);
      } else {
        undoData.data.slice(parseInt(undoData.currentPostion) - 1, 1);
        undoData.data.push(currentState);
      }
      store1.updateStoreData("undoData", undoData);
    }
  };

  const onMouseDown1 = async (options) => {
    if (activetab == "Design" && startDrawaing.current == true) {
      const canvas = editor.canvas;
      isDown.current = true;
      var pointer = canvas.getPointer(options.e);
      var points = [pointer.x, pointer.y, pointer.x, pointer.y];
      line.current = new fabric.Line(points, {
        stroke: drawData.color,
        strokeWidth: parseInt(drawData.size),
        hasBorders: false,
        lockMovementX: false,
        lockMovementY: false,
        hoverCursor: "default",
        selectable: false,
        id: "line" + Math.random(),
      });
      let dat = store1.editorData;

      dat.push(line.current);

      await store1.updateStoreData("editorData", dat);
      canvas.add(line.current);
    }
  };

  const onDblClick1 = () => {
    if (
      activetab == "Design" &&
      line.current &&
      startDrawaing.current == true
    ) {
      line.current.setCoords();
      isDown.current = false;
      line.current = null;
    }
  };

  const onMouseMove1 = (o) => {
    const canvas = editor.canvas;
    if (!isDown.current) return;
    var pointer = canvas.getPointer(o.e);
    line.current.set({
      x2: pointer.x,
      y2: pointer.y,
    });
    canvas.requestRenderAll();
  };

  function updateElement(object, styleName, value, refresh = false) {
    if (object) {
      object[styleName] = value;
      object.set({ dirty: true });
      if (refresh == false && object.type != "bg") {
        editor.canvas.setActiveObject(object);
      }
      editor.canvas.renderAll();
    }
  }

  const onMouseMove = (o) => {
    if (editor && editor.canvas && mousecursor.current != null) {
      let mouse = editor.canvas.getPointer(o.e);
      mousecursor.current
        .set({
          top: mouse.y,
          left: mouse.x,
        })
        .setCoords();
      editor.canvas.renderAll();
    }
  };

  const onAddImage = (data) => {
    let myPromise = new Promise(async (myResolve, myReject) => {
      let ext = data.src.split(".").slice(-1)[0];
      if (ext.toLowerCase() == "svg") {
        let svgText = await fetch(data.src)
          .then((r) => r.text())
          .then((text) => {
            return text;
          });
        var path = fabric.loadSVGFromString(
          svgText,
          function (objects, options) {
            var obj = fabric.util.groupSVGElements(objects, options);
            obj.set({
              id: data.id,
              stype: "image",
              nsrc: data.src,
              left: editor.canvas.getWidth() / 2,
              top: editor.canvas.getHeight() / 2,
              originX: "center",
              originY: "center",
              width: options.width,
              height: options.height,
            });
            obj.center().setCoords();
            if (obj.width > editor.canvas.width) {
              obj.scaleToWidth(editor.canvas.getWidth());
            }
            if (obj.height > editor.canvas.height) {
              obj.scaleToHeight(editor.canvas.getHeight());
            }
            editor.canvas.add(obj).renderAll();
            myResolve();
          }
        );
      } else {
        fabric.Image.fromURL(
          data.src,
          (myImg) => {
            myImg.set({
              left: data.left,
              top: data.top,
              id: data.id,
              hasRotatingPoint: false,
            });
            editor.canvas.add(myImg).setActiveObject(myImg).renderAll();

            myResolve();
          },
          { crossOrigin: "anonymous" }
        );
      }
    });
    return myPromise;
  };

  const onAddText = (data) => {
    let myPromise = new Promise(async (myResolve, myReject) => {
      let label = new fabric.Textbox(data.text, { ...data });
      let left = editor.canvas.getWidth() / 2 - data.width / 2;
      let top = editor.canvas.getHeight() / 2 - data.height / 2;
      label.set({
        hasRotatingPoint: false,
        height: data.height,
        width: data.width,
        left: left,
        top: top,
      });
      label.setControlsVisibility({
        mtr: false,
      });

      editor.canvas.add(label).renderAll();
      myResolve();
    });
    return myPromise;
  };

  const Alignment = (status, elements) => {
    let h = elements.type == "textbox" ? 2 : 1;
    if (status == "right") {
      let rightP = editor.canvas.width - (elements.width / h) * elements.scaleX;
      updateElement(elements, "left", rightP);
    } else {
      if (status == "buttom") {
        let bottomP =
          editor.canvas.height - (elements.height / h) * elements.scaleY;
        updateElement(elements, "top", bottomP);
      } else {
        let top =
          editor.canvas.getHeight() / 2 -
          ((elements.height / h) * elements.scaleY) / 2;
        let left =
          editor.canvas.getWidth() / 2 -
          ((elements.width / h) * elements.scaleX) / 2;
        elements["top"] = top;
        elements["left"] = left;
        elements.set({ dirty: true });
        editor.canvas.renderAll();
      }
    }
  };

  const applyfilter = (element, key, val) => {
    if (element) {
      element.filters = [];
      let d1 = getfilterStatus(val.name, val.value);
      if (d1) {
        element.filters.push(d1);
      }

      element.applyFilters();
      editor.canvas.renderAll();
    }
  };
  function preloadImage(url, callback) {
    var img = new Image();
    img.onload = function () {
      callback(img);
    };
    img.src = url;
    img.crossOrigin = "anonymous";
  }

  const onUpdateImage = async (obj1, src) => {
    let ext = src.split(".").slice(-1)[0];
    if (ext.toLowerCase() == "svg") {
      editor.canvas.remove(obj1);
      let { height, width, scaleX, scaleY, top, left } = obj1;
      let svgText = await fetch(src)
        .then((r) => r.text())
        .then((text) => {
          return text;
        });
      var path = fabric.loadSVGFromString(svgText, function (objects, options) {
        var obj = fabric.util.groupSVGElements(objects, options);
        obj.set({
          angle : obj1?.angle,
          stype : "image",
          nsrc : src,
          id: obj1.id,
          left: left,
          top: top,
          originX: "center",
          originY: "center",
          width: width,
          height: height,
          scaleX: scaleX,
          scaleY: scaleY,
        });
        editor.canvas.add(obj).renderAll();
      });
    } else {
      preloadImage(src, function (newImage) {
        obj1.setElement(newImage);
        editor.canvas.renderAll();
      });
    }
  };

  const updateEditor = async () => {
    if (load == false) {
      return;
    }
    if (!editorData) {
      return;
    }

    let data = editorData.filter((data) => data.status != "");
    data = data.filter((data) => data.status != undefined);

    if (data.length == 0) {
      return;
    }

    let t = document.querySelector("#siteLoader");
    t.classList.add("overlayLoader");

    for (let i = 0; i < data.length; i++) {
      if (data[i].type == "textbox") {
        if (data[i].status == "add") {
          await onAddText(data[i]);
        } else {
          let update = editor.canvas._objects.find(
            (dat) => dat.id == data[i].id
          );
          if (
            data[i].status == "right" ||
            data[i].status == "buttom" ||
            data[i].status == "center"
          ) {
            Alignment(data[i].status, update);
          } else {
            updateElement(update, data[i].status, data[i][data[i].status]);
          }
        }
      }
      if (data[i].type == "image" || data[i].type == "icon" || data[i]?.stype == "image" ) {
        if (data[i].status == "add" || data[i].status == "src") {
          let d = data[i];

          if (data[i].status == "add") {
            await onAddImage(d);
          } else if (data[i].status == "src") {
            let find = editor.canvas._objects.find(
              (dat) => dat.id == data[i].id
            );
            await onUpdateImage(find, data[i].src);
          }
        } else {
          let find = editor.canvas._objects.find((dat) => dat.id == data[i].id);
          if (
            data[i].status == "right" ||
            data[i].status == "buttom" ||
            data[i].status == "center"
          ) {
            Alignment(data[i].status, find);
          } else {
            if (data[i].status == "filter") {
              applyfilter(find, data[i].status, data[i][data[i].status]);
            } else {
              updateElement(find, data[i].status, data[i][data[i].status]);
            }
          }
        }
      }
      if (data[i].type == "path" || data[i].type == "line") {
        let find = editor.canvas._objects.find((dat) => dat.id == data[i].id);
        if (
          data[i].status == "right" ||
          data[i].status == "buttom" ||
          data[i].status == "center"
        ) {
          Alignment(data[i].status, find);
        } else {
          updateElement(find, data[i].status, data[i][data[i].status]);
        }
      }

      let index = editorData.findIndex((dat) => dat.id == data[i].id);
      editorData[index].status = "";
      t.classList.remove("overlayLoader");
      await store1.updateStoreData("editorData", editorData);
    }
  };

  const openSetting = async (obj) => {
    let label = obj?.target;
    if (activetab != "pencil" || activetab != "Design") {
      let data = editorData.find((d1) => d1.id == label?.id);
      if(data?.stype=="image"){
        let b = document.getElementById("ImageTab");
          if (b) {
            b.click();
          }
        await store1.updateStoreData("activeElement", {
          element: data?.stype,
          id: data?.id,
        });
        return
      }
      if (data?.type == "textbox") {
        let b = document.getElementById("TextTab");
        if (b) {
          b.click();
        }
      } else {
        if (data?.type == "image") {
          let b = document.getElementById("ImageTab");
          if (b) {
            b.click();
          }
        }
      }
      if (data?.type && data?.type != "path" && data?.type != "line") {
        if (data.type == "image" && label?.filters && label.filters[0]) {
          await store1.updateStoreData("activeElement", {
            element: data?.type,
            id: data?.id,
            filter: Object.keys(label.filters[0])[0],
          });
        } else {
          await store1.updateStoreData("activeElement", {
            element: data?.type,
            id: data?.id,
          });
        }
      } else {
        if (!label) {
          await store1.updateStoreData("activeElement", {
            id: "",
            element: "",
          });
        } else {
          await store1.updateStoreData("activeElement", {
            id: label.id,
            element: "draw",
          });
        }
      }
    }
  };

  let findration = (w, h) => {
    if (w > h) {
      return "landscaperation";
    } else if (h > w) {
      return "portraitratio";
    } else {
      return "squareratio";
    }
  };
  return (
    <>
      <div
        id="filter1"
        className={findration(
          parseInt(props.dimension.width),
          parseInt(props.dimension.height)
        )}
      >
        <FabricJSCanvas className={""} onReady={onReady} id="canvas" />
      </div>
    </>
  );
};

export default Canvas;
