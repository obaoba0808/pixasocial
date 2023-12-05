import React, { useEffect, useState } from 'react'
import svg from '@/components/svg';
import Head from 'next/head'
import SimpleSlider from '@/components/Slider';
import { common } from '@/components/Common';
import  {useRouter} from 'next/router'; 
import ConfirmationPopup from '@/components/common/ConfirmationPopup';
import MyModal from '@/components/common/MyModal';
import moment from 'moment';
import {encode as base64_encode} from 'base-64';


let ScheduledPost = () => {
    
    const [dropdownMenu, setDropdownMenu] = useState(false);
    const [isRemoveAction, setIsRemoveAction] = useState(false);
    const [scheduledPosts, setScheduledPosts] = useState([])
    const [isModel, setIsModel] = useState(false);
    const [priviewImage, setPriviewImage] = useState();
    
    const router = useRouter();

    useEffect(() => {
        getAllPost()
    },[])

    const getAllPost = () => {
        common.getAPI({
            method: 'GET',
            url: `post?action=Month&start=${"2023-01-01"}&end=${"2024-01-01"}`,
            data: {}
        }, (resp) => {
            if (resp.status) {
                let postDataList = [];
                resp.data.map((postData, i) => {
                    let data = {
                        month: moment().month(postData.month - 1).format("MMMM"),
                        data: postData.data
                    }
                    postDataList.push(data)
                })
                setScheduledPosts(postDataList)
            }
        })
    }

    const handleEditPost = (val) => {
        router.push({ pathname: "/create_post", query: { id: base64_encode(val._id)}});
    }

    const handleDeletePost = (val) => {
        setIsRemoveAction(val._id)
    }

    const handlePreviewEvent = (val) => {
        setPriviewImage(val)
        setIsModel(true)
    }

    let toggleModal = () => {
        setIsModel(false)
    }

    return (
        <>
            <>
                <Head>
                    <title>{process.env.SITE_TITLE}- - Schedule Post</title>
                </Head>
            </>

            <div className='rz_dashboardWrapper' >
                <div className="rz_dashboardWrapper">

                    <div className="dash_header">
                        <h2 >Scheduled And Published Post</h2>
                    </div>
                    <div className='ps_conatiner-fluid' >
                        {scheduledPosts && scheduledPosts.map((post, i) => {
                            return <div key={i} className="ps_create_post_box_bg mb-4">
                                <div className='ps_create_post_box_swipper_text'><span>  {svg.app.myReels} {post.month} {moment(post.scheduleDate).format("YYYY")}</span></div>
                                <SimpleSlider post={post} editPost={handleEditPost} deletePost={handleDeletePost} previewEvent={handlePreviewEvent} />
                            </div>
                        })}
                    </div>
                </div>
            </div>

            <MyModal
                shown={isModel}
                close={() => {
                    toggleModal();
                }}
            >
                <div className="modal-body">
                    <div className="modal-header">
                        <h3>Priview Image</h3>
                    </div>
                    {priviewImage?.url ? <div className='preview_Image'>
                        <img src={priviewImage?.url} />
                    </div> : <div className='preview_Image'>
                        <img src="../assets/images/test2.jpg" />
                    </div>}
                </div>
            </MyModal>

            <ConfirmationPopup
                shownPopup={isRemoveAction}
                closePopup={() => setIsRemoveAction(false)}
                type={"Post"}
                removeAction={() => {
                    common.getAPI({
                        method: 'DELETE',
                        url: 'post',
                        data: {
                            target: isRemoveAction
                        },
                    }, (resp) => {
                       if(resp.status){
                        setIsRemoveAction(false);
                        getAllPost()
                       }
                    });
                }}
            />

        </>

    )
}

export default ScheduledPost;

