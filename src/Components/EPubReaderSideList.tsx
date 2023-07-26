import {
    faArrowLeft,
    faArrowRight,
    faBookmark,
    faThumbtack,
    faArrowUp,
    faArrowDown,
} from "@fortawesome/free-solid-svg-icons";
import { faBookmark as farBookmark } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { memo, useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setPrevNextChapter } from "../store/prevNextChapter";
import { addBookmark, updateEPUBBookmark, removeBookmark } from "../store/bookmarks";

const EPubReaderSideList = memo(
    ({
        tocData,
        openNextChapterRef,
        openPrevChapterRef,
        currentChapterURL,
        // setCurrentChapterURL,
        addToBookmarkRef,
        setshortcutText,
        isBookmarked,
        setBookmarked,
        findInPage,
        epubLinkClick,
        isSideListPinned,
        setSideListPinned,
        setSideListWidth,
        makeScrollPos,
        zenMode,
    }: {
        tocData: TOCData;
        openNextChapterRef: React.RefObject<HTMLButtonElement>;
        openPrevChapterRef: React.RefObject<HTMLButtonElement>;
        /**
         * `~` if appSettings.epubReaderSettings.loadOneChapter is `false`
         */
        currentChapterURL: string;
        // setCurrentChapterURL: React.Dispatch<React.SetStateAction<string>>;

        epubLinkClick: (ev: MouseEvent | React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
        addToBookmarkRef: React.RefObject<HTMLButtonElement>;
        isBookmarked: boolean;
        setBookmarked: React.Dispatch<React.SetStateAction<boolean>>;
        setshortcutText: React.Dispatch<React.SetStateAction<string>>;
        isSideListPinned: boolean;
        setSideListPinned: React.Dispatch<React.SetStateAction<boolean>>;
        setSideListWidth: React.Dispatch<React.SetStateAction<number>>;
        findInPage: (str: string, forward?: boolean) => void;
        makeScrollPos: (callback?: ((queryString?: string) => any) | undefined) => void;
        zenMode: boolean;
    }) => {
        const bookInReader = useAppSelector((store) => store.bookInReader);
        // const history = useAppSelector((store) => store.history);
        const appSettings = useAppSelector((store) => store.appSettings);
        const linkInReader = useAppSelector((store) => store.linkInReader);
        const prevNextChapter = useAppSelector((store) => store.prevNextChapter);
        // const contextMenu = useAppSelector((store) => store.contextMenu);

        const dispatch = useAppDispatch();

        const sideListRef = useRef<HTMLDivElement>(null);
        const [findInPageStr, setFindInPageStr] = useState<string>("");
        const [isListOpen, setListOpen] = useState(false);
        const [preventListClose, setpreventListClose] = useState(false);
        // const prevMangaRef = useRef<string>("");
        // const [historySimple, setHistorySimple] = useState<string[]>([]);
        const [draggingResizer, setDraggingResizer] = useState(false);
        const currentRef = useRef<HTMLAnchorElement | null>(null);
        useEffect(() => {
            if (!zenMode && currentRef.current)
                setTimeout(() => {
                    currentRef.current?.scrollIntoView({ block: "start" });
                }, 100);
        }, [zenMode]);
        // useLayoutEffect(() => {
        // }, [findInPage]);

        // console.log('bbb');

        // useEffect(() => {
        //     if (!contextMenu && !isSideListPinned) return setListOpen(false);
        //     setpreventListClose(true);
        // }, [contextMenu]);
        // useEffect(() => {
        //     if (mangaInReader) {
        //         const historyItem = history.find((e) => e.mangaLink === window.path.dirname(mangaInReader.link));
        //         if (historyItem) setHistorySimple(historyItem.chaptersRead);
        //     }
        // }, [history]);
        useLayoutEffect(() => {
            if (isSideListPinned) {
                setListOpen(true);
            }
        }, [isSideListPinned]);

        const changePrevNext = () => {
            if (bookInReader) {
                const listData = tocData.nav.map((e) => e.src);
                let nextIndex = (listData.findIndex((e) => e.includes(currentChapterURL)) || 0) + 1;
                if (nextIndex < listData.length && listData[nextIndex] === currentChapterURL) nextIndex += 1;
                let prevIndex = (listData.findIndex((e) => e.includes(currentChapterURL)) || 0) - 1;
                if (prevIndex > 0 && listData[prevIndex] === currentChapterURL) prevIndex -= 1;
                const prevCh = prevIndex < 0 ? "~" : listData[prevIndex];
                const nextCh = nextIndex >= listData.length ? "~" : listData[nextIndex];
                // console.log({ prev: prevCh, next: nextCh });
                dispatch(setPrevNextChapter({ prev: prevCh, next: nextCh }));
            }
        };

        useEffect(() => {
            if (appSettings.epubReaderSettings.loadOneChapter) changePrevNext();
            else dispatch(setPrevNextChapter({ prev: "~", next: "~" }));
        }, [tocData, currentChapterURL]);

        // useEffect(() => {
        //     if (mangaInReader) {
        //         if (prevMangaRef.current === mangaInReader.mangaName) {
        //             changePrevNext();
        //             return;
        //         }
        //         prevMangaRef.current = mangaInReader.mangaName;
        //         makeChapterList();
        //     }
        // }, [mangaInReader]);

        // useEffect(() => {
        //     console.log(prevNextChapter, currentChapterURL);
        // }, [prevNextChapter]);

        const handleResizerDrag = (e: MouseEvent) => {
            if (draggingResizer) {
                if (isSideListPinned) {
                    makeScrollPos();
                }
                const width =
                    e.clientX > (window.innerWidth * 90) / 100
                        ? (window.innerWidth * 90) / 100
                        : e.clientX < 192
                        ? 192
                        : e.clientX;
                setSideListWidth(width);
            }
        };
        const handleResizerMouseUp = () => {
            setDraggingResizer(false);
        };
        useLayoutEffect(() => {
            document.body.style.cursor = "auto";
            if (draggingResizer) {
                document.body.style.cursor = "ew-resize";
            }
            window.addEventListener("mousemove", handleResizerDrag);
            window.addEventListener("mouseup", handleResizerMouseUp);
            return () => {
                window.removeEventListener("mousemove", handleResizerDrag);
                window.removeEventListener("mouseup", handleResizerMouseUp);
            };
        }, [draggingResizer]);
        return (
            <div
                className={`readerSideList listCont ${isListOpen ? "open" : ""}`}
                onMouseEnter={() => {
                    setpreventListClose(true);
                    if (!isListOpen) setListOpen(true);
                }}
                onMouseLeave={(e) => {
                    if (!isSideListPinned) {
                        // if (preventListClose && !contextMenu && !e.currentTarget.contains(document.activeElement))
                        if (preventListClose && !e.currentTarget.contains(document.activeElement))
                            setListOpen(false);
                        setpreventListClose(false);
                    }
                }}
                onMouseDown={(e) => {
                    if (e.target instanceof Node && e.currentTarget.contains(e.target)) setpreventListClose(true);
                }}
                onBlur={(e) => {
                    if (!preventListClose && !e.currentTarget.contains(document.activeElement)) setListOpen(false);
                }}
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        e.currentTarget.blur();
                    }
                }}
                ref={sideListRef}
                tabIndex={-1}
            >
                <div
                    className="indicator"
                    onClick={() => {
                        makeScrollPos();
                        if (isSideListPinned) {
                            sideListRef.current?.blur();
                            setListOpen(false);
                        }
                        setSideListPinned((init) => !init);
                    }}
                >
                    <FontAwesomeIcon
                        icon={faThumbtack}
                        style={{ transform: isSideListPinned ? "rotate(45deg)" : "" }}
                    />
                </div>
                <div
                    className="reSizer"
                    onMouseDown={() => {
                        setDraggingResizer(true);
                    }}
                    onMouseUp={handleResizerMouseUp}
                ></div>
                <div className="tools">
                    <div className="row1">
                        <input
                            type="text"
                            name=""
                            spellCheck={false}
                            placeholder="Find In Page"
                            // tabIndex={-1}
                            onChange={(e) => {
                                // if (e.currentTarget.value === "")
                                setFindInPageStr(e.currentTarget.value);
                            }}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === "Escape") {
                                    e.currentTarget.blur();
                                }
                                if (e.key === "Enter") {
                                    if (e.shiftKey) {
                                        findInPage(findInPageStr, false);
                                    } else findInPage(findInPageStr);
                                }
                            }}
                            onBlur={(e) => {
                                if (e.currentTarget.value === "") findInPage("");
                            }}
                        />
                        <button
                            // tabIndex={-1}
                            data-tooltip="Previous"
                            onClick={() => {
                                findInPage(findInPageStr, false);
                            }}
                        >
                            <FontAwesomeIcon icon={faArrowUp} />
                        </button>
                        <button
                            // tabIndex={-1}
                            data-tooltip="Next"
                            onClick={() => {
                                findInPage(findInPageStr);
                            }}
                        >
                            <FontAwesomeIcon icon={faArrowDown} />
                        </button>
                    </div>
                    <div className="row2">
                        <Button_A
                            className="ctrl-menu-item"
                            btnRef={openPrevChapterRef}
                            tooltip="Open Previous"
                            disabled={prevNextChapter.prev === "~"}
                            clickAction={() => {
                                if (sideListRef.current) {
                                    sideListRef.current.querySelectorAll("a").forEach((e) => {
                                        if (e.getAttribute("data-href") === prevNextChapter.prev)
                                            (e as HTMLAnchorElement).click();
                                    });
                                }

                                // dispatch(setLinkInReader({ type: "image", link: prevNextChapter.prev, page: 1 }));
                            }}
                        >
                            <FontAwesomeIcon icon={faArrowLeft} />
                        </Button_A>
                        <Button_A
                            className="ctrl-menu-item"
                            tooltip="Bookmark"
                            btnRef={addToBookmarkRef}
                            clickAction={() => {
                                if (isBookmarked) {
                                    return window.dialog
                                        .warn({
                                            title: "Warning",
                                            message:
                                                "Remove - Remove Bookmark\n" +
                                                "Replace - Replace existing bookmark with current location",
                                            noOption: false,
                                            buttons: ["Cancel", "Remove", "Replace"],
                                            defaultId: 0,
                                        })
                                        .then(({ response }) => {
                                            if (response === 1) {
                                                dispatch(removeBookmark(linkInReader.link));
                                                setshortcutText("Bookmark Removed");
                                                setBookmarked(false);
                                            }
                                            if (response === 2) {
                                                makeScrollPos(() => {
                                                    setshortcutText("Bookmark Updated");
                                                    dispatch(
                                                        updateEPUBBookmark({
                                                            link: linkInReader.link,
                                                        })
                                                    );
                                                });
                                            }
                                        });
                                }
                                if (bookInReader) {
                                    makeScrollPos(() => {
                                        if (window.app.epubHistorySaveData)
                                            dispatch(
                                                addBookmark({
                                                    type: "book",
                                                    data: {
                                                        ...bookInReader,
                                                        chapter: window.app.epubHistorySaveData.chapter,
                                                        elementQueryString:
                                                            window.app.epubHistorySaveData.queryString,
                                                    },
                                                })
                                            );
                                        setshortcutText("Bookmark Added");
                                        setBookmarked(true);
                                    });
                                }
                            }}
                        >
                            <FontAwesomeIcon icon={isBookmarked ? faBookmark : farBookmark} />
                        </Button_A>
                        <Button_A
                            className="ctrl-menu-item"
                            btnRef={openNextChapterRef}
                            tooltip="Open Next"
                            disabled={prevNextChapter.next === "~"}
                            clickAction={() => {
                                if (sideListRef.current) {
                                    // [data-depth="1"
                                    sideListRef.current.querySelectorAll("a").forEach((e) => {
                                        // console.log({ a: e.getAttribute("data-href"), b: prevNextChapter.next });
                                        if (e.getAttribute("data-href") === prevNextChapter.next)
                                            (e as HTMLAnchorElement).click();
                                        // (
                                        //     sideListRef.current.querySelector(
                                        //         `a[data-href="${prevNextChapter.next}"`
                                        //     ) as HTMLAnchorElement
                                        // ).click();
                                    });
                                }
                                // dispatch(updateLastHistoryPage({ linkInReader: linkInReader.link }));
                                // dispatch(setLinkInReader({ type: "image", link: prevNextChapter.next, page: 1 }));
                            }}
                        >
                            <FontAwesomeIcon icon={faArrowRight} />
                        </Button_A>
                    </div>
                </div>
                <div className="in-reader">
                    <div>
                        <span className="bold">Title</span>
                        <span className="bold"> : </span>
                        <span>{tocData.title}</span>
                    </div>
                    {/* <div>
                    <span className="bold">Author</span>
                    <span className="bold"> : </span>
                    <span>{tocData.author}</span>
                </div> */}
                    {appSettings.epubReaderSettings.loadOneChapter && (
                        <div>
                            <span className="bold">Chapter</span>
                            <span className="bold"> : </span>
                            <span>{tocData.nav.find((e) => e.src.includes(currentChapterURL))?.name || "~"}</span>
                        </div>
                    )}
                </div>
                <div className="location-cont">
                    <List
                        tocData={tocData}
                        currentChapterURL={currentChapterURL}
                        epubLinkClick={epubLinkClick}
                        sideListRef={sideListRef}
                        // setCurrentChapterURL={setCurrentChapterURL}
                        currentRef={currentRef}
                    />
                </div>
            </div>
        );
    }
);

const List = memo(
    ({
        tocData,
        currentChapterURL,
        epubLinkClick,
        sideListRef,
        // setCurrentChapterURL,
        currentRef,
    }: {
        tocData: TOCData;
        currentChapterURL: string;
        epubLinkClick: (ev: MouseEvent | React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
        sideListRef: React.RefObject<HTMLDivElement>;
        // setCurrentChapterURL: React.Dispatch<React.SetStateAction<string>>;
        currentRef: React.MutableRefObject<HTMLAnchorElement | null>;
    }) => {
        const temp_ListShow: boolean[] = [];
        const temp = useMemo(
            () =>
                tocData.nav.reduce((acc, cur) => {
                    const len = acc.length;
                    if (tocData.depth === 2) {
                        if (cur.depth === 2) {
                            acc.push({ parent: cur, child: [] });
                            temp_ListShow.push(false);
                        }
                        if (cur.depth === 1) acc[len - 1].child.push(cur);
                        if (cur.src.includes(currentChapterURL)) temp_ListShow[acc.length - 1] = true;
                    }
                    return acc;
                }, [] as { parent: TOCData["nav"][0]; child: TOCData["nav"] }[]),
            [currentChapterURL]
        );

        const [listShow, setListShow] = useState(temp_ListShow);
        useLayoutEffect(() => {
            setListShow(temp_ListShow);
        }, [currentChapterURL]);
        // useLayoutEffect(() => {
        //     console.log(listShow);
        // }, [listShow]);
        // console.log(tocData.depth, temp);

        //! i have literally no idea wtf i was doing here

        const ListItem = ({
            name,
            depth,
            src,
            index = -1,
        }: {
            name: string;
            depth: number;
            src: string;
            index?: number;
        }) => {
            const show = index < 0 ? true : listShow[index];
            return (
                <li
                    className={`${src.includes(currentChapterURL) ? "current" : ""} ${
                        depth === 2 ? "collapse" : ""
                    } ${!show ? "collapsed" : ""}`}
                    style={{ "--depth": depth - 1 }}
                    onClick={() => {
                        if (depth === 2) {
                            setListShow((init) => {
                                const dup = [...init];
                                dup[index] = !dup[index];
                                return dup;
                            });
                        }
                    }}
                >
                    {/* {depth===2&& <span className={`toggleCollapse ${!show?"collapsed ":""}`}>▼</span> } */}
                    <a
                        onClick={(ev) => {
                            ev.stopPropagation();
                            epubLinkClick(ev);
                            sideListRef.current?.blur();

                            // why was it here before?
                            // setCurrentChapterURL(ev.currentTarget.getAttribute("data-href") || "~");
                        }}
                        data-href={src}
                        data-depth={depth}
                        title={name}
                        ref={(node) => {
                            if (src.includes(currentChapterURL)) {
                                currentRef.current = node;
                                node?.scrollIntoView({ block: "start" });
                            }
                        }}
                    >
                        <span className="text">{"\u00A0".repeat((tocData.depth - depth) * 5) + name}</span>
                    </a>
                </li>
            );
        };
        if (tocData.depth === 2 && temp.length > 0) {
            return (
                <ol>
                    {temp.map((e, i) => (
                        <React.Fragment key={e.parent.name}>
                            <ListItem {...e.parent} key={e.parent.name} index={i} />
                            {e.child.map((c) => (
                                <ListItem {...c} key={c.name} index={i} />
                            ))}
                        </React.Fragment>
                    ))}
                </ol>
            );
        }
        return (
            <ol>
                {tocData.nav.map((e) => (
                    <ListItem {...e} key={e.name} />
                ))}
            </ol>
        );
    },
    (prev, next) => prev.currentChapterURL === next.currentChapterURL
);

const Button_A = (props: any) => {
    return (
        <button
            className={props.className}
            data-tooltip={props.tooltip}
            ref={props.btnRef}
            onClick={props.clickAction}
            // tabIndex={-1}
            disabled={props.disabled}
            // onFocus={(e) => e.currentTarget.blur()}
        >
            {props.children}
        </button>
    );
};
export default EPubReaderSideList;
