import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppContext } from "../App";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setReaderSettings } from "../store/appSettings";
import { setMangaInReader } from "../store/mangaInReader";
import { setReaderOpen } from "../store/isReaderOpen";
import { setLoadingMangaPercent } from "../store/loadingMangaPercent";
import { setLoadingManga } from "../store/isLoadingManga";
import { setLinkInReader } from "../store/linkInReader";
import { newHistory } from "../store/history";
import { setContextMenu } from "../store/contextMenu";

type ReaderImageSrc = string;
type ReaderHTML = Document;

interface DisplayData {
    type: "image" | "html";
    /**
     * id from content.opf
     */
    id: string;
    url: string;
    content: ReaderHTML | ReaderImageSrc;
}
const EPubReader = () => {
    const { pageNumberInputRef, checkValidFolder } = useContext(AppContext);

    const appSettings = useAppSelector((store) => store.appSettings);
    const shortcuts = useAppSelector((store) => store.shortcuts);
    const isReaderOpen = useAppSelector((store) => store.isReaderOpen);
    const linkInReader = useAppSelector((store) => store.linkInReader);
    const mangaInReader = useAppSelector((store) => store.mangaInReader);
    const isLoadingManga = useAppSelector((store) => store.isLoadingManga);
    const bookmarks = useAppSelector((store) => store.bookmarks);
    const pageNumChangeDisabled = useAppSelector((store) => store.pageNumChangeDisabled);
    const prevNextChapter = useAppSelector((store) => store.prevNextChapter);

    const dispatch = useAppDispatch();

    const [displayData, setDisplayData] = useState<DisplayData[]>([]);
    /**
     * string of id
     */
    const [displayOrder, setDisplayOrder] = useState<string[]>([]);

    const ImagePart = ({ src }: { src: ReaderImageSrc }) => {
        return (
            <div className="cont imgCont">
                <img src={src} alt="Image" />
            </div>
        );
    };

    const HTMLPart = ({ xhtml, url }: { xhtml: ReaderHTML; url: string }) => {
        return (
            <div
                className="cont htmlCont"
                ref={(node) => {
                    if (node) {
                        //! temp, use memo or smoething
                        while (node.hasChildNodes()) {
                            node.removeChild(node.childNodes[0]);
                        }
                        node.id = "epub-" + xhtml.body.id;
                        // node.setAttribute("data-link-id", url);
                        // xhtml.querySelectorAll('[rel="stylesheet"').forEach((e) => {
                        //     const href = e.getAttribute("href") || "$$";
                        //     if (!loadedStylesheets.includes(href)) {
                        //         const stylesheet = document.createElement("style");
                        //         const txt = window.fs.readFileSync(href, "utf-8");
                        //         console.log(txt, href, loadedStylesheets);
                        //         stylesheet.innerHTML = txt;
                        //         node.appendChild(stylesheet);
                        //         // setLoadedStylesheets((init) => [...init, href]);
                        //     }
                        // });
                        xhtml.body.childNodes.forEach((childNode) => {
                            node.appendChild(childNode.cloneNode(true));
                        });
                        node.querySelectorAll("a").forEach((e) => {
                            e.addEventListener("click", (ev) => {
                                ev.preventDefault();
                                const data_href = e.getAttribute("data-href");
                                if (data_href) {
                                    const idFromURL = displayData.find((a) => a.url === data_href)?.id;
                                    if (idFromURL) document.getElementById("epub-" + idFromURL)?.scrollIntoView();
                                } else {
                                    if (e.href) {
                                        window.electron.shell.openExternal(e.href);
                                    }
                                }
                            });
                        });
                        node.querySelectorAll("img").forEach((e) => {
                            e.oncontextmenu = (ev) => {
                                dispatch(
                                    setContextMenu({
                                        clickX: ev.clientX,
                                        clickY: ev.clientY,
                                        hasLink: {
                                            link: e.getAttribute("src") || "",
                                            simple: {
                                                isImage: true,
                                            },
                                        },
                                    })
                                );
                            };
                        });
                    }
                }}
            ></div>
        );
    };

    const PartCont = ({ data }: { data: DisplayData | string }) => {
        if (typeof data === "string") return <p className="error">{data}</p>;
        return data.type === "html" ? (
            <HTMLPart xhtml={data.content as ReaderHTML} url={data.url} />
        ) : (
            <ImagePart src={data.content as ReaderImageSrc} />
        );
    };

    const loadEPub = (link: string) => {
        console.log("loadEpub");
        link = window.path.normalize(link);
        const linkSplitted = link.split(window.path.sep).filter((e) => e !== "");
        const extractPath = window.path.join(
            window.electron.app.getPath("temp"),
            `yomikiru-temp-EPub-${linkSplitted[linkSplitted.length - 1]}-${window.crypto.randomUUID()}`
        );
        console.log("extracting ", link, " at ", extractPath);
        window.crossZip.unzip(link, extractPath, (err) => {
            if (err) {
                // dispatch(setUnzipping(false));
                if (err.message.includes("spawn unzip ENOENT"))
                    return window.dialog.customError({
                        message: "Error while extracting.",
                        detail: '"unzip" not found. Please install by using\n"sudo apt install unzip"',
                    });
                return window.dialog.customError({
                    message: "Error while extracting.",
                    detail: err.message,
                    log: false,
                });
            }
            console.log("done extraxting epub file.");
            const parser = new DOMParser();
            const META_INF_TEXT = window.fs.readFileSync(
                window.path.join(extractPath, "META-INF/container.xml"),
                "utf-8"
            );
            const META_INF = parser.parseFromString(META_INF_TEXT, "text/xml");
            const CONTENT_PATH = window.path.join(
                extractPath,
                META_INF.querySelector("rootfile")?.getAttribute("full-path") || ""
            );
            if (
                CONTENT_PATH &&
                window.fs.existsSync(CONTENT_PATH) &&
                !window.fs.lstatSync(CONTENT_PATH).isDirectory()
            ) {
                const CONTENT_OPF_TEXT = window.fs.readFileSync(CONTENT_PATH, "utf-8");
                const CONTENT_OPF = parser.parseFromString(CONTENT_OPF_TEXT, "text/xml");
                const manifestData = CONTENT_OPF.querySelectorAll("manifest > item");
                if (manifestData.length > 0) {
                    const tempDisplayData: DisplayData[] = [];
                    manifestData.forEach((e) => {
                        const mediaType = e.getAttribute("media-type");
                        if (mediaType === "application/xhtml+xml") {
                            const href = e.getAttribute("href");
                            if (href) {
                                const filePath = window.path.join(window.path.dirname(CONTENT_PATH), href);
                                const txt = window.fs.readFileSync(filePath, "utf-8");
                                const xhtml = parser.parseFromString(txt, "application/xhtml+xml");
                                xhtml.querySelectorAll("[src]").forEach((e) => {
                                    const src_old = e.getAttribute("src") || "";
                                    e.setAttribute(
                                        "src",
                                        window.path.join(window.path.dirname(filePath), src_old)
                                    );
                                });
                                // console.log(xhtml.querySelectorAll("[href]"));
                                xhtml.querySelectorAll("[href]").forEach((e) => {
                                    const href_old = e.getAttribute("href") || "$$";
                                    if (!href_old.startsWith("http")) {
                                        // (e as HTMLLinkElement).href = (e as HTMLLinkElement).href.split("#").splice(-1)[0];
                                        e.setAttribute(
                                            "data-href",
                                            window.path.join(window.path.dirname(filePath), href_old)
                                        );
                                        e.removeAttribute("href");
                                    }
                                });
                                xhtml.querySelectorAll("[id]").forEach((e) => e.removeAttribute("id"));
                                xhtml.body.id = e.getAttribute("id") || "";
                                tempDisplayData.push({
                                    type: "html",
                                    content: xhtml,
                                    id: e.getAttribute("id") || "",
                                    url: filePath,
                                });
                            }
                        }
                        if (mediaType?.startsWith("image/")) {
                            const href = window.path.join(
                                window.path.dirname(CONTENT_PATH),
                                e.getAttribute("href") || ""
                            );
                            if (href) {
                                const filePath = window.path.join(window.path.dirname(CONTENT_PATH), href);
                                tempDisplayData.push({
                                    type: "image",
                                    content: href,
                                    id: e.getAttribute("id") || "",
                                    url: filePath,
                                });
                            }
                        }
                    });
                    const spineData = CONTENT_OPF.querySelectorAll("spine > itemref");
                    if (spineData.length > 0) {
                        const tempIDREf: string[] = [];
                        spineData.forEach((e, i) => {
                            tempIDREf.push(e.getAttribute("idref") || "no-idref-found-" + i);
                        });
                        setDisplayData(tempDisplayData);
                        setDisplayOrder(tempIDREf);
                    }
                }
            }
        });
    };

    useLayoutEffect(() => {
        loadEPub(linkInReader.link);
    }, [linkInReader]);

    useEffect(() => {
        dispatch(setReaderOpen(true));
    }, []);
    return (
        <div
            id="EPubReader"
            className="reader"
            style={{
                display: isReaderOpen ? "block" : "block",
            }}
            tabIndex={-1}
        >
            <section className="main">
                {displayOrder.map((e, i) => (
                    <PartCont data={displayData.find((a) => a.id === e) || e} key={"key-" + i} />
                ))}
            </section>
        </div>
    );
};

export default EPubReader;
