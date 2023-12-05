import svg from "@/components/svg";
import { useEffect, useState } from "react";
import { appStore } from '@/zu_store/appStore';
import MyModal from "@/components/common/MyModal";
import { NoDataWrapper, common, setMyState } from '@/components/Common';
import Router, { useRouter } from 'next/router';
import { decode as base64_decode } from 'base-64';
import { toast } from "react-toastify";
import { capitalizeFirstLowercaseRest } from "../utils/utility";
import ConfirmationPopup from "../common/ConfirmationPopup";

export default function CreatePost(props) {
    const [priviewImage, setPriviewImage] = useState();
    const [customTabIndex, setcustomTabIndex] = useState(0);
    const [tabIndex, setTabIndex] = useState(0);
    const [isLocalImg, setIsLocalImg] = useState(false);
    const [isDisabled, setIsDisabled] = useState(true);
    const [isNextDisabled, setIsNextDisabled] = useState(true);
    const [isTextRegenBtn, setIsTextRegenBtn] = useState(true);
    const [isUseTextBtn, setIsUseTextBtn] = useState(true);
    const [isTextAreaDisabled, setIsTextAreaDisabled] = useState(true);
    const [isImageGenAI, setIsImageGenAI] = useState(true)
    const [modal, setModal] = useState(false);
    const [imgModal, setImgModal] = useState(false);
    const [showTextArea, setShowTextArea] = useState(false);
    const [isPreviewImage, setIsPreviewImage] = useState(false);
    const [multiPost, setMutliPost] = useState([]);
    const [previousPost, setPreviousPost] = useState();
    const [update, setupdate] = useState("false")
    const [isRemove, setIsRemove] = useState(false);
    const [isRemoveAction, setIsRemoveAction] = useState(false);
    const [postDataObj, setPostDataObj] = useState({
        title: "",
        text: "",
        searchText: "",
        searchImageText: "",
        aiText: "",
        aiImage: "",
        localImg: "",
        url: "",
        files: [],
        scheduleDate: "",
        socialMediaAccounts: {},
        timeZone: "",
        isMultiPost: false
    });

    let [state, setQuery] = useState({
        postLoading: false,
        isLoading: false,
        libraryData: [],
        totalRecords: 0,
        page: 1,
        limit: 12,
        isRemoveAction: false
    });

    const router = useRouter();

    let myStore = appStore(state => state);
    let storePostData = myStore.postData.singlePost;
    let storeMultiPostData = myStore.postData.multiPost;

    useEffect(() => {
        if (storeMultiPostData?.length > 0) {
            setMutliPost(storeMultiPostData)
        }
    }, [storeMultiPostData])

    useEffect(() => {
        if (!router.query.id) {
            if (postDataObj?.text?.length > 0 || postDataObj?.url?.length > 0) {
                postDataObj.title = ""
                postDataObj.text = ""
                postDataObj.aiText = ""
                postDataObj.aiImage = ""
                postDataObj.localImg = ""
                postDataObj.url = ""
                postDataObj.files = []
                postDataObj.scheduleDate = ""
                postDataObj.socialMediaAccounts = {}
                postDataObj.timeZone = ""
                setPostDataObj({ ...postDataObj })
            }
            if ((storePostData?.text || storePostData?.url) || storePostData?.scheduleDate) {
                postDataObj.title = storePostData?.title
                postDataObj.text = storePostData?.text
                postDataObj.url = storePostData?.url
                postDataObj.scheduleDate = storePostData?.scheduleDate
                setPostDataObj({ ...postDataObj })
                setIsNextDisabled(false)
            }
        } else {
            getPostById()
        }
    }, [router.query.id])

    useEffect(() => {
        if (customTabIndex == 2) {
            getLibraryImages()
        }
    }, [customTabIndex == 2, state.page])

    let cntStart = ((state.page - 1) * state.limit) + 1, cnt = cntStart;


    const toggleModal = () => {
        postDataObj.searchText = ""
        postDataObj.aiText = ""
        setPostDataObj({ ...postDataObj })
        setIsDisabled(true)
        setModal(false)
        setShowTextArea(false)
    }

    const getLibraryImages = () => {
        setMyState(setQuery, {
            isLoading: true
        });


        common.getAPI({
            method: 'GET',
            url: 'media',
            data: {
                mediaType: "image",
                page: state.page,
                limit: state.limit,
            },
        }, (resp) => {
            if (resp.status) {
                setMyState(setQuery, {
                    libraryData: state.page == 1 ? resp.data : [...state.libraryData, ...resp.data],
                    totalRecords: resp.totalRecords,
                    isLoading: false
                });
            }
        });
    }

    const handleCustomTab = (tabIndex) => {
        if (customTabIndex == tabIndex) return
        setMyState(setQuery, {
            isLoading: true,
            page: 1,
            limit: 12,
            libraryData: []
        });
        setcustomTabIndex(tabIndex)
    }

    const handleDelete = (i) => {
        setIsRemove(true)
        setRemovePost(i)
    }

    const inputHandler = (event) => {
        postDataObj[event.target.id] = capitalizeFirstLowercaseRest(event.target.value.trimStart())
       
        setPostDataObj({ ...postDataObj })
        if (event.target.id === "text") {
            setIsNextDisabled(false)
        }

        if (event.target.id === "searchText" || event.target.id === "searchImageText" && Object.values(event.target.value.trimStart()).length > 0) {
            if (postDataObj.searchText || postDataObj.searchImageText) {
                setIsDisabled(false)
                setIsTextRegenBtn(false)
            } else {
                setIsDisabled(true)
                setIsTextRegenBtn(true)
            }
        } else {
            setIsDisabled(true)
            
        }
    }

    const handleTextModal = () => {
      
        setModal(true)
    }

    const getAiText = () => {
        common.getAPI({
            method: 'POST',
            url: 'openai',
            data: {
                content: `I need ${postDataObj.searchText} information in 5 lines`
            },
        }, (resp) => {
            if (resp.status) {
                postDataObj.aiText = resp.data
                setPostDataObj({ ...postDataObj })
                setIsTextAreaDisabled(false)
                setIsUseTextBtn(false)
                setIsTextRegenBtn(false)
                setShowTextArea(true)
            }
        });
    }

    const AiText = (aiText) => {
        postDataObj.text = aiText
        postDataObj.aiText = ""
        setPostDataObj({ ...postDataObj })
        setIsTextAreaDisabled(true)
        setIsDisabled(true)
        setIsUseTextBtn(true)
        setIsTextRegenBtn(true)
        toggleModal()
        if (postDataObj?.text || postDataObj?.url) {
            setIsNextDisabled(false)
        } else {
            setIsNextDisabled(false)
        }

    }

    const handleOnTabChange = (event, newValue) => {
        setTabIndex(newValue)
    }

    const tab1 = () => {
        return <div className="ps_tabs_padd"><div className='ps_assets_upload_user p-0'>
            {!isLocalImg ? <div className='ps_assets_upload_inner'>
                <label htmlFor="rz_uploadAudio" className='rz_uploadBtn_user'>
                    <span className='ps_assets_icon m-auto mb-3'>
                        {svg.app.uploadIcon}
                    </span>
                    <div className='ps_assets_text ms-0'>
                        <h6 className="pb-3"> Upload Post Image</h6>
                        <p>Supports: jpeg, png</p>
                    </div>
                    <input disabled={process.env.TYPE=="demo" ? true :false} type='file' className='rz_customFile' accept={"image/*"} onChange={(e) => uploadLocalImage(e)} />
                </label>
            </div> : <div className='rz_custom_form'>
                <div className="ps_assets_icon_imgbox m-auto">
                    {postDataObj?.localImg ? <img
                        alt="not found"
                        width={"250px"}
                        src={postDataObj?.localImg}
                    /> : ""}
                </div>
                <div className="d-flex justify-content-between mt-4">
                    <button className='rz_addAccBtn ' disabled={isUseTextBtn} onClick={storeLocalImage}>Use Image </button>
                    <button className='rz_addAccBtn_blk' onClick={() => setIsLocalImg(false)}>Cancel</button>
                </div>
            </div>
            }
        </div>
        </div>
    }

    const tab2 = () => {
        return <>

            <div className="ps_tabs_padd">
                {!postDataObj?.aiImage ? <div className="" style={{ marginTop: "80px" }}>
                    <label className="form-label pt-2"> Prompt For AI Image<span className="text-danger">*</span></label>
                    <div className="d-flex justify-content-between">
                        <div className="col-10 me-2">
                            <input type="text" id="searchImageText" placeholder="Enter prompt for AI image" className="form-control form-control-md" value={postDataObj?.searchImageText || ""} onChange={(e) => inputHandler(e)} />
                        </div>
                        <button className='rz_addAccBtn' disabled={isDisabled} onClick={() => generateAiImage()}>Generate</button>
                    </div>

                </div> : ""}
                {postDataObj?.aiImage ? <>
                    <div className=" ">
                        <label className="form-label pt-2"> Prompt for AI image<span className="text-danger">*</span></label>
                        <div className="d-flex justify-content-between">
                            <div className="col-10 ">
                                <input type="text" id="searchImageText" placeholder="Enter prompt for AI image" className="form-control form-control-md" value={postDataObj?.searchImageText || ""} onChange={(e) => inputHandler(e)} />
                            </div>
                            <button className='rz_addAccBtn' disabled={isDisabled} onClick={() => generateAiImage()}>Generate</button>
                        </div>
                    </div>

                    <div className='rz_custom_form'>
                        <div className="ps_assets_icon_imgbox m-auto">
                            <img src={postDataObj?.aiImage} />
                        </div>
                        <div className="d-flex justify-content-between mt-2">
                            <button className='rz_addAccBtn ' disabled={isUseTextBtn} onClick={useAiImage}>Use Image +</button>
                            <button className='rz_addAccBtn_blk' disabled={isTextRegenBtn} onClick={regenrateImage}>Re-Generate</button>
                        </div>
                    </div>   </> : ""}
            </div>
        </>
    }
    const tab3 = () => {
        return <div className="ps_tabs_padd"><div className="PS_create_url_gallery ">
            {state.libraryData.length > 0 &&
                <>   {state.libraryData && state.libraryData.map((item, i) => {
                    return (<div key={i} className='PS_create_url_gallery_imgbox'>
                        <img src={`${process.env.S3_PATH}${item.path}`} alt={item.title} loading="lazy" onClick={() => uploadLibraryImage(item)} />
                    </div>)
                })}
                </>}
        </div>

            <div className=''>
                <div className='rz_gridInnerBox ps_img_not_found' >
                    {state.isLoading &&
                        <NoDataWrapper
                            isLoading={state.isLoading}
                            blockCount="6"
                            height={"220"}
                            width="220"
                            className="rz_gridCol p-2"
                            section="media"
                            dataCount={state.libraryData.length}
                            title={'Images not found.'}
                        />}
                </div>
                {!state.isLoading &&
                    <NoDataWrapper
                        isLoading={state.isLoading}
                        blockCount="6"
                        height={"220"}
                        width="220"
                        className="rz_gridCol p-2"
                        section="media"
                        dataCount={state.libraryData.length}
                        title={'Images not found.'}
                    />
                }
            </div>

            {
                state.libraryData.length < state.totalRecords && !state.isLoading ?
                    <button className='ps_image_creator_blk_btn  mt-4 mx-auto' onClick={() => {
                        setMyState(setQuery, {
                            isLoading: true,
                            page: state.page + 1,
                            limit: 12
                        });
                    }} >  Load More {svg.app.loadmore}</button>

                    : <></>
            }
        </div>
    }

    const generateAiImage = () => {
        common.getAPI({
            method: 'POST',
            url: 'openai',
            data: {
                content: `I need image of ${postDataObj?.searchImageText} `,
                action: "ImageGenrate"
            },
        }, (resp) => {
            if (resp.status) {
                postDataObj.aiImage = resp.data.data[0].url;
                setPostDataObj({ ...postDataObj });
                setIsUseTextBtn(false)
                setIsTextRegenBtn(false)
            }
        });
    }

    const regenrateImage = () => {
        generateAiImage()
    }

    const useAiImage = () => {
        common.getAPI({
            method: 'POST',
            url: 'post',
            data: {
                url: postDataObj?.aiImage,
                action: "useImage"
            },
        }, (resp) => {
            if (resp.status) {
                postDataObj.aiImage = ""
                postDataObj.searchImageText = ""
                postDataObj.url = resp.data
                setPostDataObj({ ...postDataObj })
                setImgModal(false)
                setIsUseTextBtn(false)
                setIsTextRegenBtn(false)
                setIsImageGenAI(true)
                if (postDataObj?.url) {
                    setIsNextDisabled(false)
                }
            }
        });

    }

    const storeLocalImage = () => {
        let selectedFile = postDataObj?.files[0];
        let meta = "{ 'width' : 300, 'height':200}";
        let data = new FormData();
        data.append("file", selectedFile, selectedFile?.name);
        data.append("meta", meta);
        common.getAPI({
            method: 'POST',
            url: 'media?mediaType=image',
            data: data,
            isFormData: true,
        }, (resp) => {
            if (resp.status) {
                postDataObj.localImg = ""
                postDataObj.url = process.env.S3_PATH + resp.data
                setPostDataObj({ ...postDataObj })
                setImgModal(false)
                setIsLocalImg(false)
                getLibraryImages()
                setIsNextDisabled(false)
            }
        });
    }

    const uploadLibraryImage = (obj) => {
        postDataObj.url = `${process.env.S3_PATH}${obj.path}`
        setPostDataObj({ ...postDataObj })
        setImgModal(false)
        setIsUseTextBtn(false)
        setIsTextRegenBtn(false)
        setIsImageGenAI(true)
        setIsNextDisabled(false)
    }

    const uploadLocalImage = async (event) => {
        if (event.target.files[0].type == "image/jpeg" || event.target.files[0].type == "image/png") {
            postDataObj.files = event.target.files
            const url = await URL.createObjectURL(event.target.files[0])
            postDataObj.localImg = url
            setPostDataObj({ ...postDataObj })
            setIsLocalImg(true)
            setIsUseTextBtn(false)
        } else {
            toast.error('Please upload png/jpeg file type ');
        }
    }


    const getPostById = () => {
        common.getAPI({
            method: 'GET',
            url: 'post',
            data: {
                target: base64_decode(router.query.id)
            }
        }, (resp) => {
            if (resp.status) {
              (postDataObj.title = resp.data[0]?.title),
              (postDataObj.text = resp.data[0]?.text),
              (postDataObj.url = resp.data[0]?.url),
              (postDataObj.scheduleDate = resp.data[0].scheduleDate),
              (postDataObj.socialMediaAccounts =
              resp.data[0].socialMediaAccounts),
              (postDataObj.timeZone = resp.data[0].timeZone);
              setPostDataObj({ ...postDataObj });
              setIsNextDisabled(false);
            }

        })
    }

    const removeSelectedImage = () => {
        postDataObj.url = ""
        setPostDataObj({ ...postDataObj })
    }

    const submitData = () => {
        if (multiPost.length > 1) {
            let storeData = {
                singlePost: {},
                multiPost: multiPost,
                step: 1
            }
            myStore.updateStoreData("postData", storeData)
        } else if (multiPost.length == 1) {
            let singlePost = {
                title: multiPost[0]?.title,
                text: multiPost[0]?.text,
                url: multiPost[0]?.url,
                scheduleDate: "",
                socialMediaAccounts: [],
                timeZone: {},
            }
            let data = {
                singlePost: singlePost,
                multiPost: [],
                step: 1
            }
            myStore.updateStoreData("postData", data)

        } else {
            if (postDataObj?.title?.length == 0) {
                toast.error('Please add post title');
                return;
            }
            if (postDataObj?.url?.length == 0 && postDataObj?.text?.length == 0) {
                toast.error('Please add text or image');
                return;
            }
            if (postDataObj?.text?.length == 0 && postDataObj?.url?.length == 0) {
                toast.error('Please add image');
                return;
            }

            let singlePost = {
                title: postDataObj?.title,
                text: postDataObj?.text,
                url: postDataObj?.url,
                scheduleDate: postDataObj?.scheduleDate,
                socialMediaAccounts: postDataObj?.socialMediaAccounts,
                timeZone: postDataObj?.timeZone,
            }

            let data = {
                singlePost: singlePost,
                multiPost: [],
                step: 1
            }
            myStore.updateStoreData("postData", data)
        }
    }

    const viewPostTab = () => {
        return <div className='' >
            <div className="dash_header  mb-1">
                <h6 className="mb-0"> Posts</h6>
            </div>
            <div className={postDataObj?.url ? "ps_upcoming_list_div pt-2 ps_scroll_upcoming_box_700" : " ps_upcoming_list_div pt-2 ps_scroll_upcoming_box_400"}>

                {multiPost.length > 0 && multiPost.map((post, i) => {
                    return <div className={"upcomg_post_box ".concat(update == i ? " editbox" : "")} key={i}>
                        <div className="upcomg_post_details">
                            <div className="dash_icon_box" >
                                {post.url ? <div className='ps_dash_comming_box '> <img src={post?.url} /></div> :
                                    <div className="ps_dash_comming_box"><p>{post.text}</p> </div>}
                            </div>

                            <div className="upcomg_post_text">

                                <p>{post.title}</p>
                            </div>
                        </div>
                        <div className="ps_upcomg_post_details_icons">
                            <span className="social_box_edit" onClick={() => addSelectedPost(post, i)}>
                                {svg.app.editIcon}
                                <span className='rz_tooltipSpan'>Edit</span>
                            </span>
                        
                                <span className="social_box_delete" onClick={() => setIsRemoveAction(String(i))}>
                                    {svg.app.deleteIcon}
                                    <span className='rz_tooltipSpan'>Delete</span>
                                </span>
                            
                        </div>
                    </div>

                })}
            </div>
        </div>
    }

    const addCreatePost = () => {
        if (postDataObj?.title?.length == 0) {
            toast.error('Please add post title');
            return;
        }
        if (postDataObj?.url?.length == 0 && postDataObj?.text?.length == 0) {
            toast.error('Please add text or image');
            return;
        }
        if (postDataObj?.text?.length == 0 && postDataObj?.url?.length == 0) {
            toast.error('Please add image');
            return;
        }

        let data = {
            title: postDataObj?.title,
            text: postDataObj?.text,
            url: postDataObj?.url,
            scheduleDate: postDataObj?.scheduleDate,
            socialMediaAccounts: postDataObj?.socialMediaAccounts,
            timeZone: postDataObj?.timeZone,
            step: 1
        }

        multiPost.push(data)
        setMutliPost([...multiPost])
        postDataObj.title = ""
        postDataObj.text = ""
        postDataObj.aiText = ""
        postDataObj.aiImage = ""
        postDataObj.localImg = ""
        postDataObj.url = ""
        postDataObj.files = []
        postDataObj.scheduleDate = ""
        postDataObj.socialMediaAccounts = {}
        postDataObj.timeZone = ""
        setPostDataObj({ ...postDataObj })
    }

    const handleMultiPostDelete = (index) => {
        multiPost.splice(index, 1)
        setMutliPost([...multiPost])
        if (multiPost.length == 0) {
            setPreviousPost()
        }
        setupdate("false")
        postDataObj.title = ""
        postDataObj.text = ""
        postDataObj.aiText = ""
        postDataObj.aiImage = ""
        postDataObj.localImg = ""
        postDataObj.url = ""
        postDataObj.files = []
        postDataObj.scheduleDate = ""
        postDataObj.socialMediaAccounts = {}
        postDataObj.timeZone = ""
        setPostDataObj({ ...postDataObj })
        setIsRemoveAction(false)
    }

    const addSelectedPost = (selectedPost, index) => {
        setupdate(index)
        if (previousPost) {
            let data = {
                title: postDataObj.title,
                text: postDataObj.text,
                url: postDataObj.url,
                scheduleDate: "",
                socialMediaAccounts: "",
                timeZone: "",
                step: 1
            }
        }
        setPreviousPost(selectedPost)
        handleEditPost(selectedPost, index)
    }

    const handleEditPost = (postData, index) => {
        postDataObj.title = postData?.title
        postDataObj.url = postData?.url
        postDataObj.text = postData?.text
        setPostDataObj({ ...postDataObj })
    }



    const updatePost = () => {
        if (postDataObj?.title.trim() == "") {
            toast.error("Please add post title")
            return
        }
        if (postDataObj?.url.trim() == "" && postDataObj?.text.trim() == "") {
            toast.error("Please add text or image")
            return
        }
        let mul = [...multiPost]

        if (mul[update]) {
            mul[update].title = postDataObj?.title
            mul[update].url = postDataObj?.url
            mul[update].text = postDataObj?.text
            setMutliPost(mul)
            postDataObj.title = ""
            postDataObj.text = ""
            postDataObj.aiText = ""
            postDataObj.aiImage = ""
            postDataObj.localImg = ""
            postDataObj.url = ""
            postDataObj.files = []
            postDataObj.scheduleDate = ""
            postDataObj.socialMediaAccounts = {}
            postDataObj.timeZone = ""
            setPostDataObj({ ...postDataObj })
            setupdate("false")
        }
    }

    return (
        <>

            <div className='rz_dashboardWrapper' >
                <div className="ps_integ_conatiner">
                    <div className="welcomeWrapper">
                        <div>
                            <div className="dash_header">
                                <h2>{router.query.id ? "Update Post" : "Create Post"}</h2>
                            </div>
                            <div className="ps_header_tabs">
                                <div className="ps_header_back invisible" ><a>{svg.app.backIcon}<span> Back</span></a> </div>
                                <div><h3>Add Text / Image</h3> </div>
                                <div className="ps_header_steps"><span>STEPS</span> <div className="ps_header_spin">1</div> </div>
                            </div>
                        </div>
                        <div className="ps_create_post_box">
                            <div className=" ps_create_post_box_bg_step2">
                                <div className="col-md-12">
                                    <div className="d-lg-flex">

                                        <div className="ps_schedule_box m-auto ps_wdth_500">
                                            <label className="form-label pt-2">Title <span className="text-danger">*</span></label>
                                            <div className=" ps_create_post_input_box">
                                                <div className="col-12 ">
                                                    <input type="text" id="title" placeholder="Enter post title" className="form-control form-control-md" value={postDataObj?.title || ""} onChange={(e) => inputHandler(e)} />
                                                </div>
                                            </div>

                                            <div className='rz_custom_form mt-0'>
                                                <div className="ps_create_post_text_btn">
                                                    <label className="form-label pt-2"> Caption <span className="text-danger">*</span></label>
                                                    <div><button className="rz_addAccBtn " onClick={handleTextModal}> Generate Caption +</button></div>
                                                </div>
                                                <textarea
                                                    type='text'
                                                    id="text"
                                                    className='rz_customInput rz_customTextArea'
                                                    placeholder='Enter caption'
                                                    value={postDataObj?.text || ""}
                                                    onChange={(e) => inputHandler(e)}
                                                ></textarea>
                                            </div>
                                            <div className="ps_create_post_img">
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="col-md-7 me-2">
                                                        <label className="form-label"> <div className="d-flex align-items-center gap-2">  Image</div></label>
                                                    </div>
                                                    <button className='rz_addAccBtn' onClick={() => setImgModal(true)}>{postDataObj?.url ? "Update Image +" : "Choose Image +"}</button>
                                                </div>
                                                {postDataObj?.url ? <div className="pt-2">
                                                    <div className="ps_assets_icon_imgbox m-auto">
                                                        <img src={postDataObj?.url} />
                                                        <div className="ps_assets_icon_close_btn" onClick={() => removeSelectedImage()} >{svg.app.closeIcon}</div>
                                                    </div>
                                                </div> : ""}
                                            </div>
                                        </div>
                                        {multiPost.length > 0 ? <div className="ps_wdth_400 ms-lg-3">
                                            <div className="ps_schedule_box mt-lg-0 mt-4 ">
                                                <div >
                                                    {viewPostTab()}
                                                </div>
                                            </div>
                                        </div> : ""}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-center d-flex justify-content-center gap-2">
                            {update === "false" ? <button className='rz_addAccBtn_blk' onClick={() => addCreatePost()}> Add  Post {svg.app.plusIcon}</button>
                                :
                                <button className='rz_addAccBtn_blk' onClick={() => updatePost()}> Update</button>
                            }
                            <button className='rz_addAccBtn' onClick={submitData}> Next {svg.app.nextIcon}</button>
                        </div>
                    </div>
                </div>
            </div>

            <MyModal
                shown={modal}
                close={() => {
                    toggleModal();
                }}
            >
                <div className="modal-body" style={{ width: "100%" }}>
                    <div className="modal-header">
                        <h3>Generate Caption</h3>
                    </div>
                    {!showTextArea ? <div className="">
                        <label className="form-label pt-2"> Prompt For Caption <span className="text-danger">*</span></label>
                        <div className="d-flex justify-content-between">

                            <div className="col-10 col-9  me-2">
                                <input type="text" id="searchText" placeholder="Enter prompt for caption" className="form-control form-control-md" value={postDataObj?.searchText || ""} onChange={(e) => inputHandler(e)} />
                            </div>
                            <button className='rz_addAccBtn' disabled={isDisabled} onClick={getAiText}>Generate </button>
                        </div>
                    </div> : <> <div className="">
                        <label className="form-label pt-2"> Prompt For Caption <span className="text-danger">*</span></label>
                        <div className="d-flex justify-content-between">

                            <div className=" col-10  me-2">
                                <input type="text" id="searchText" placeholder="Enter prompt for caption" className="form-control form-control-md" value={postDataObj?.searchText || ""} onChange={(e) => inputHandler(e)} />
                            </div>
                            <button className='rz_addAccBtn' disabled={isDisabled} onClick={getAiText}>Generate </button>
                        </div>
                    </div>
                        <div className='rz_custom_form'>
                            <textarea
                                type='text'
                                id="aiText"
                                className='rz_customInput rz_customTextArea'
                                placeholder='Text'
                                disabled={isTextAreaDisabled}
                                value={postDataObj?.aiText || ""}
                                onChange={(e) => inputHandler(e)}
                            ></textarea>
                            <div className="d-flex justify-content-center gap-2">
                                <button className='rz_addAccBtn' disabled={isUseTextBtn} onClick={() => { AiText(postDataObj?.aiText) }}>Use Text +</button>
                                <button className='rz_addAccBtn_blk' disabled={isTextRegenBtn} onClick={getAiText}>Re-Generate</button>
                            </div>
                        </div> </>}
                </div>
            </MyModal >

            <MyModal
                shown={imgModal}
                close={() => {
                    setImgModal(false);
                    setTabIndex(0)
                    setcustomTabIndex(0)
                    setMyState(setQuery, {
                        page: 1,
                        limit: 12
                    });

                }}
            >
                <div className="modal-body" style={{ width: "100%" }}>
                    <div className="modal-header">
                        <h3>Add Image</h3>
                    </div>
                    <div className="">
                        <div className=" ps_create_post_tabs" >
                            <div className={`ps_create_post ${customTabIndex == 0 ? "ps_create_post_active" : ""}`}>
                                <h6 onClick={() => handleCustomTab(0)}> Upload Image</h6>
                            </div>
                            <div className={`ps_create_post ${customTabIndex == 1 ? "ps_create_post_active" : ""}`}>
                                <h6 onClick={() => handleCustomTab(1)}>Generate Image</h6>
                            </div>
                            <div className={`ps_create_post ${customTabIndex == 2 ? "ps_create_post_active" : ""}`}>
                                <h6 onClick={() => handleCustomTab(2)}> Image Library</h6>
                            </div>
                        </div>
                        <div className="ps_create_post_box_bg_tabs">
                            <div className="">
                                <div className="">
                                    {customTabIndex === 0 && tab1()}
                                    {customTabIndex === 1 && tab2()
                                    }
                                    {customTabIndex === 2 && tab3()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </MyModal >

            <MyModal
                shown={isPreviewImage}
                close={() => {
                    setIsPreviewImage(false);
                    setTabIndex(0)
                    setcustomTabIndex(0)
                }}
            >
                <div className="modal-body" style={{ width: "100%" }}>
                    <div className="modal-header">
                        <h3>View Image</h3>
                    </div>
                    <div className='preview_Image'>
                        <img src={priviewImage?.url} />
                    </div>
                </div>
            </MyModal >

            <ConfirmationPopup
                shownPopup={isRemoveAction}
                closePopup={() => {
                    setIsRemoveAction(false)
                }}
                type={"Post"}
                removeAction={() => {
                    handleMultiPostDelete(isRemoveAction)
                }}
            />
        </>
    )

}

