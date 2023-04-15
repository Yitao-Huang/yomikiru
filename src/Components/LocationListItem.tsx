import { faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactElement, useContext } from "react";
import { AppContext } from "../App";
import { setContextMenu } from "../store/contextMenu";
import { useAppDispatch, useAppSelector } from "../store/hooks";

const LocationListItem = ({
    name,
    link,
    inHistory,
    setCurrentLink,
}: {
    name: string;
    link: string;
    setCurrentLink: React.Dispatch<React.SetStateAction<string>>;
    inHistory?: boolean;
}): ReactElement => {
    const { openInReader } = useContext(AppContext);
    const appSettings = useAppSelector((store) => store.appSettings);

    const dispatch = useAppDispatch();

    const onClickHandle = () => {
        if (!window.fs.existsSync(link)) {
            window.dialog.customError({ message: "Directory/File doesn't exist." });
            return;
        }
        if (
            appSettings.openDirectlyFromManga &&
            window.path.normalize(window.path.resolve(link + "../../../") + window.path.sep) ===
                appSettings.baseDir
        ) {
            openInReader(link);
        } else if (window.app.isSupportedFormat(name)) {
            openInReader(link);
        } else setCurrentLink(link);
    };

    return (
        <li className={inHistory ? "alreadyRead" : ""}>
            <a
                className="a-context"
                title={name}
                onClick={(e) => {
                    if (appSettings.openOnDblClick) {
                        const elem = e.currentTarget;
                        if (!elem.getAttribute("data-dblClick")) {
                            elem.setAttribute("data-dblClick", "true");
                            setTimeout(() => {
                                if (elem.getAttribute("data-dblClick") === "true") {
                                    elem.removeAttribute("data-dblClick");
                                    onClickHandle();
                                }
                            }, 250);
                        } else {
                            elem.removeAttribute("data-dblClick");
                            openInReader(link);
                        }
                    } else onClickHandle();
                }}
                onContextMenu={(e) => {
                    dispatch(
                        setContextMenu({
                            clickX: e.clientX,
                            clickY: e.clientY,
                            hasLink: {
                                link,
                                simple: {
                                    isImage: false,
                                },
                            },
                        })
                    );
                    // showContextMenu({
                    //     e: e.nativeEvent,
                    //     isFile: true,
                    //     link: link,
                    // });
                }}
                tabIndex={-1}
            >
                <span className="text">{name}</span>
            </a>
            <button
                title="Open In Reader"
                className="open-in-reader-btn"
                // onFocus={(e) => e.currentTarget.blur()}
                onClick={() => openInReader(link)}
                // onclick="makeImg($(this).siblings('a').attr('data-link'))"
            >
                <FontAwesomeIcon icon={faAngleRight} />
            </button>
        </li>
    );
};

export default LocationListItem;
