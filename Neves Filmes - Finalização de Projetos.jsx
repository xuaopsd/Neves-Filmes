(function () {
    var CONFIG = {
    UNDO_GROUP_NAME: "Neves Filmes - Finalização Automática",
    NO_COMP_ERROR: "Nenhuma composição final encontrada.\nSelecione uma ou mais composições ou deixe uma composição ativa.",
    REDUCE_SUCCESS: "Projeto limpo! - Somente o essencial foi mantido.",
    SUCCESS_MESSAGE: "FINALIZAÇÃO COMPLETA - NEVES FILMES\n\nComposições finais movidas para _COMPS\n Projeto pronto para ser entregue!",
    ERROR_PREFIX: "NEVES FILMES - ERRO: "
    };

    app.beginUndoGroup(CONFIG.UNDO_GROUP_NAME);

    function getFinalCompsSmart() {
        var comps = [];
        for (var i = 0; i < app.project.selection.length; i++) {
            if (app.project.selection[i] instanceof CompItem) {
                comps.push(app.project.selection[i]);
            }
        }
        if (comps.length === 0 && app.project.activeItem instanceof CompItem) {
            comps.push(app.project.activeItem);
        }
        var seen = {};
        var result = [];
        for (var j = 0; j < comps.length; j++) {
            if (!seen[comps[j].id]) {
                seen[comps[j].id] = true;
                result.push(comps[j]);
            }
        }
        return result;
    }

    function getOrCreateFolder(name, parent) {
        parent = parent || app.project.rootFolder;
        for (var i = 1; i <= app.project.numItems; i++) {
            var it = app.project.item(i);
            if (it instanceof FolderItem && it.name === name && it.parentFolder === parent) {
                return it;
            }
        }
        var f = app.project.items.addFolder(name);
        f.parentFolder = parent;
        return f;
    }

    function organizeFootageItems(f) {
        var imgExt = ["png","jpg","jpeg","jpe","jif","jfif","jfi","webp","avif","heif","heic","heix","hevc","hevx","gif","apng","bmp","dib","rle","tif","tiff","xcf","ora","kra","clip","exr","hdr","pic","tga","icb","vda","vst","jp2","j2k","jpf","jpx","jpm","mj2","dds","ktx","ktx2","pvr","astc","ico","cur","icns","raw","dng","crw","cr2","cr3","nef","nrw","arw","srf","sr2","orf","rw2","raf","3fr","kdc","erf","mef","mos","mrw","pef","srw","x3f","iiq","jp2","jxr","wdp","hdp","pcx","pcc","ppm","pgm","pbm","pnm","pfm","webp","jxl","sgi","rgb","rgba","bw","dds","pspimage","wbmp","fax","sun","ras","xpm","xwd","pcd"];
        var vecExt = ["ai","eps","psd","psb","svg","svgz","pdf","ps"];
        var audioExt = ["wav","wave","aif","aiff","aifc","mp3","m4a","aac","flac","ogg","oga","opus","wma","ac3","amr","caf","snd","au"];

        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (!(item instanceof FootageItem)) continue;

            var src = item.mainSource;
            var fileExt = "";
            if (item.file && item.file.name) {
                var parts = item.file.name.split(".");
                if (parts.length > 1) {
                    fileExt = parts[parts.length - 1].toLowerCase();
                }
            }

            if (src.isMissing) {
                item.parentFolder = f.MISSING;
                continue;
            }

            if (src instanceof SolidSource) {
                item.parentFolder = f.SOLIDS;
                continue;
            }

            if ((src.hasAudio && !src.hasVideo) || audioExt.indexOf(fileExt) !== -1) {
                item.parentFolder = f.AUDIOS;
                continue;
            }

            if (src.hasVideo) {
                item.parentFolder = f.FOOTAGE;
                continue;
            }

            if (imgExt.indexOf(fileExt) !== -1) {
                item.parentFolder = f.IMAGES;
                continue;
            }

            if (vecExt.indexOf(fileExt) !== -1) {
                item.parentFolder = f.AIPSD;
                continue;
            }

            item.parentFolder = f.FOOTAGE;
        }
    }

    function deleteOldFolders() {
        var keep = {"_COMPS":1,"PRECOMPS":1,"AUDIOS":1,"FOOTAGE":1,"IMAGES":1,"AI & PSD":1,"NULL & SOLIDS":1,"MISSING":1};
        for (var i = app.project.numItems; i >= 1; i--) {
            var item = app.project.item(i);
            if (!(item instanceof FolderItem)) continue;
            if (item === app.project.rootFolder) continue;
            if (keep[item.name]) continue;
            if (item.numItems === 0) {
                item.remove();
            }
        }
    }

    try {
        var finalComps = getFinalCompsSmart();
        if (finalComps.length === 0) throw CONFIG.NO_COMP_ERROR;

        var removed = app.project.reduceProject(finalComps);
        alert(CONFIG.REDUCE_SUCCESS + "\n" + removed + " itens removidos.");

        var fCOMPS = getOrCreateFolder("_COMPS");
        var fPRECOMPS = getOrCreateFolder("PRECOMPS", fCOMPS);
        var fAUDIOS = getOrCreateFolder("AUDIOS");
        var fFOOTAGE = getOrCreateFolder("FOOTAGE");
        var fIMAGES = getOrCreateFolder("IMAGES");
        var fAIPSD = getOrCreateFolder("AI & PSD");
        var fSOLIDS = getOrCreateFolder("NULL & SOLIDS");
        var fMISSING = getOrCreateFolder("MISSING");

        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem) {
                item.parentFolder = fPRECOMPS;
            }
        }

        for (var c = 0; c < finalComps.length; c++) {
            finalComps[c].parentFolder = fCOMPS;
        }

        organizeFootageItems({
            MISSING: fMISSING,
            SOLIDS: fSOLIDS,
            AUDIOS: fAUDIOS,
            FOOTAGE: fFOOTAGE,
            IMAGES: fIMAGES,
            AIPSD: fAIPSD
        });

        deleteOldFolders();

        alert(CONFIG.SUCCESS_MESSAGE);

    } catch (e) {
        alert(CONFIG.ERROR_PREFIX + e);
    } finally {
        app.endUndoGroup();
    }

})();