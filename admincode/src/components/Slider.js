import React, { Component, useEffect, useState } from "react";
import svg from '@/components/svg';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import moment from "moment";

export default function SimpleSlider(props) {
  const [menuToggle, setMenuToggle] = useState(false);
  const [currentIndex, setCurrentIndex] = useState();
  const { post } = props;

  useEffect(() => {
    let handler = () => {
      setMenuToggle(false)
      if (currentIndex) {
        setCurrentIndex(null)
      }
    }
    document.addEventListener('mousedown', handler);
  })

  const handleMenuToggle = (index) => {
    if (menuToggle) {
      if (currentIndex !== index) {
        setMenuToggle(true)
        setCurrentIndex(index)
      } else {
        setCurrentIndex(index)
        setMenuToggle(false)
      }
    } else {
      setCurrentIndex(index)
      setMenuToggle(true)
    }
  }

  const showDate = (date) => {
    const displayDate = moment(date).format("DD-MMM");
    return displayDate;
  }

  return (
    <>
      <Swiper
        spaceBetween={30}
        slidesPerView={1}
        loop={false}

        navigation={true}
        className="xyz"
        breakpoints={{
          480: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          
          840: {
            slidesPerView: 3,
            spaceBetween: 20,
          },
          1200: {
            slidesPerView: 4,
            spaceBetween: 20,
          },
          1600: {
            slidesPerView: 6,
            spaceBetween: 30,
          },
        }}
        modules={[Autoplay, Navigation]} >
        {post && post.data.map((val, i) => {
          return (
            <SwiperSlide key={i}>
              <div className='template_inner_post' >
                {val.url ? <div className='template_inner_img_post'><img src={val.url} /></div> :
                  <div className='template_inner_img_post'><img src="../assets/images/test2.jpg" /></div>}
                <div className="ps_droptoggle">
                  <div className='rz_menuIcon' onClick={() => handleMenuToggle(i)}> {svg.app.menu_icon}</div>
                  {menuToggle && currentIndex == i ? <div className='ps_dropdownHolder'>
                    <ul>
                      <li onClick={() => { props.editPost(val) }}><a>Update</a></li>
                      <li onClick={() => { props.deletePost(val) }} > <a >Delete </a></li>
                      <li onClick={() => { props.previewEvent(val)}} > <a >Preview </a></li>
                    </ul>
                  </div> : ""}
                </div>
                <div className='ps_template_text_post'>
                  <h4>{val?.title || "Test"}</h4>
                  <div className="d-flex  p-0">
                    <div className="ps_template_post_date"><span>{ moment(val.scheduleDate).format("DD-MMM")}</span> </div>
                    <div className="ps_template_post_text">
                      <h6>Type -<span>Image</span></h6>
                      <h6>Status - <span> {val.status}</span></h6>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          )
        })
        }
      </Swiper>
    </>
  );

}