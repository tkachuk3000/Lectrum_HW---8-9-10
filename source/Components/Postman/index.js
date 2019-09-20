// Core
import React from 'react';
// import { Transition } from 'react-transition-group';
// import { fromTo } from 'gsap';

// Instruments
import Styles from './styles.m.css';

import { withProfile } from 'components/HOC/withProfile';
const Postman = (props) => {
 
    return (
        <section className = { Styles.postman }>
            <img src = { props.avatar } />
            <span>Welcome online, {props.currentUserFirstName}</span>
        </section>
    );
};

export default withProfile(Postman);