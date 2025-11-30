import { ReactElement, useContext, useEffect, useState } from "react";
import { setAppSettings } from "../store/appSettings";
// import { setContextMenu } from "../store/contextMenu";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import BookmarkTab from "./BookmarkTab";
import ContextMenu from "./ContextMenu";
import EPubReader from "./EPubReader";
import HistoryTab from "./HistoryTab";
import LoadingScreen from "./LoadingScreen";
import LocationsTab from "./LocationsTab";
import Reader from "./Reader";
import Settings from "./Settings";
import AniLogin from "./anilist/AniLogin";
import { AppContext } from "../App";
import MenuList from "./Element/MenuList";
import InputColorReal from "./Element/InputColorReal";

const Main = (): ReactElement => {
    const appSettings = useAppSelector((store) => store.appSettings);
    const isReaderOpen = useAppSelector((store) => store.isReaderOpen);
    const linkInReader = useAppSelector((store) => store.linkInReader);
    const anilistToken = useAppSelector((store) => store.anilistToken);
    const isAniLoginOpen = useAppSelector((store) => store.isAniLoginOpen);

    const { contextMenuData, optSelectData, colorSelectData, setColorSelectData } = useContext(AppContext);
    const dispatch = useAppDispatch();

    const [filter, setFilter] = useState<string>("");

    return (
        <div id="app" className={appSettings.disableListNumbering ? "noListNumbering " : ""}>
            <div
                className="tabCont"
                // ref={tabContRef}
                style={{
                    display: isReaderOpen ? "none" : "flex",
                }}
            >
                <LocationsTab filter={filter} setFilter={setFilter}/>
                <div
                    className="divider"
                    onClick={() =>
                        // am i fr doing this
                        dispatch(
                            setAppSettings({
                                showTabs: {
                                    bookmark: !appSettings.showTabs.bookmark,
                                    history: appSettings.showTabs.history,
                                },
                            })
                        )
                    }
                >
                    <div className="bar"></div>
                </div>
                <BookmarkTab
                //  ref={bookmarkTabRef}
                />
                <div
                    className="divider"
                    onClick={() =>
                        dispatch(
                            setAppSettings({
                                showTabs: {
                                    bookmark: appSettings.showTabs.bookmark,
                                    history: !appSettings.showTabs.history,
                                },
                            })
                        )
                    }
                >
                    <div className="bar"></div>
                </div>
                <HistoryTab
                // ref={historyTabRef}
                />
            </div>
            <Settings />
            <LoadingScreen />
            {contextMenuData && <ContextMenu />}
            {optSelectData && <MenuList />}
            {colorSelectData && <InputColorReal />}
            {!anilistToken && isAniLoginOpen && <AniLogin />}
            {linkInReader.type === "image" && linkInReader.link !== "" ? <Reader filter={filter} setFilter={setFilter}/> : ""}
            {linkInReader.type === "book" && linkInReader.link !== "" ? <EPubReader /> : ""}
        </div>
    );
};

export default Main;
