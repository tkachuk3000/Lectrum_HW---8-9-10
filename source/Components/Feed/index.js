// Core
import React, {Component} from 'react';
import { Transition, CSSTransition, TransitionGroup } from 'react-transition-group';
import { fromTo } from 'gsap';

// Components
import { withProfile } from 'components/HOC/withProfile';
import StatusBar from 'components/StatusBar';
import Composer from 'components/Composer';
import Post from 'components/Post';
import Spinner from 'components/Spinner';
import Catcher from 'components/Catcher';
import Postman from 'components/Postman';

//Instruments
import Styles from './styles.m.css';
import { api, TOKEN, GROUP_ID } from 'config/api';
import { socket } from 'socket/init';
import { clearInterval } from 'timers';

@withProfile
export default class Feed extends Component{

    state = {
        posts:[],
        spin: false,
        animatePostman: true,
        // animatePosts: true,
    };

    componentDidMount() {
        const { currentUserFirstName, currentUserLastName } = this.props;
        this._fetchPosts();
       
        socket.emit('join', GROUP_ID);

        socket.on('create', (postJSON) => {
            const { data: createdPost, meta } = JSON.parse(postJSON);
            if (
                `${currentUserFirstName} ${currentUserLastName}` !==
                `${meta.authorFirstName} ${meta.authorLastName}`
            ) {
                this.setState(({ posts }) =>({
                    posts: [createdPost, ...posts],
                }))
            };
        });

        socket.on('remove', (postJSON) => {
            const { data: removedPost, meta } = JSON.parse(postJSON);
            if (
                `${currentUserFirstName} ${currentUserLastName}` !==
                `${meta.authorFirstName} ${meta.authorLastName}`
            ) {
                this.setState(({ posts }) =>({
                    posts: posts.filter((post) => post.id !== removedPost.id)
                }));
            };
        });
// Дом.Задание - 8
        socket.on('like', (post) => {
            const { data } = JSON.parse(post);
            if (
                `${currentUserFirstName} ${currentUserLastName}` !==
                `${data.firstName} ${data.lastName}`
            ){
                this.setState((posts) =>({
                    posts: posts.map((post) => post.id == data.id ? data : post)
                }));
            }
        })
    };

    componentWillUnmount () {
        // socket.removeListener('like');
        socket.removeListener('create');
        socket.removeListener('remove');
    };
    
    _setPostsFetchingState = (state) => {
        this.setState({
            spin: state,
        })
    }

    _fetchPosts = async () => {
        this._setPostsFetchingState(true);

        const response  = await fetch(api,{
            method: 'GET'
        });

        const { data: posts } = await response.json();

        this.setState({
            posts,
            spin: false,
        });
    };
    
    _createPost = async (comment) => {
        this._setPostsFetchingState(true);
        
        const response  = await fetch(api,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: TOKEN,
            },
            body: JSON.stringify({ comment }),
        });

        const { data: post } = await response.json();

        this.setState(({ posts }) => ({
            posts:[post, ...posts],
            spin: false,
        }));
    };

    _likePost = async (id) => {
        this._setPostsFetchingState(true);

        const response  = await fetch(`${api}/${id}`,{
            method: 'PUT',
            headers: {
                Authorization: TOKEN,
            },    
        });

        const { data: likedPost } = await response.json(); 
        this.setState(({ posts }) => ({
            posts:posts.map(
                (post) => post.id === likedPost.id ? likedPost : post,
            ),
            spin: false,
            }),()=>console.log('console state when Liking Post => ',this.state));
    };

    _deletePostFromState = async (id) => {
        this._setPostsFetchingState(true);

        const response  = await fetch(`${api}/${id}`,{
            method: 'DELETE',
            headers: {
                Authorization: TOKEN,
            },    
        });

        const newPosts = this.state.posts.filter(post =>{
           
            if(!(post.id === id)) {
                return {
                    ...post
                };
            };
        })

        this.setState({
            posts:  newPosts,
            spin: false,
            // animatePosts: false,
        })
    };
    
    _animateComposerEnter = (composer) => {
        fromTo(
            composer,
            2,
            {opacity: 0,rotationX:90,width:50}, 
            { opacity: 1,rotationX:0,width:500}
        )
    };
// Дом.Задание - 9
    _animatePostmanEnter = (elem) => {
        fromTo(
            elem, 
            3, 
            { opacity: 0, width: 0, right: -250}, 
            { opacity: 1,  width: 250, right: 30, onComplete: () => this.setState({animatePostman: false}) }
        );
    };
    
    _animatePostmanExit = (elem) => {
        fromTo(elem, 3, { opacity: 1, right: 30}, { opacity: 0.2, right: -250})   
    }

    render (){
        const { posts, spin, animatePostman} = this.state;
                                //    ,animatePosts 
        const postsJSX = posts.map((post) =>{
            return (
                <CSSTransition 
                    classNames = {{
                        enter:       Styles.postInStart,
                        enterActive: Styles.postInEnd,
                        exit:        Styles.postOutStart,
                        exitActive:  Styles.postOutEnd,
                    }}
                    // in = {animatePosts}
                    key = { post.id }
                    timeout = {{
                        enter: 1000,
                        exit: 1000
                    }}>
                    <Catcher> 
                        <Post 
                            {...post} 
                            _likePost = {this._likePost} 
                            _deletePostFromState = {this._deletePostFromState}
                        />
                    </Catcher>
                </CSSTransition>
            );
        });

        return (
            <section className = {Styles.feed}>
               <Spinner isSpinning  = {spin} />
               <StatusBar />
               <Transition
               appear
               in
               onEnter = { this._animateComposerEnter}
               timeout = { 5000 }>
                    <Composer _createPost = {this._createPost}/>
               </Transition>
               <TransitionGroup>{postsJSX}</TransitionGroup>
               <Transition
                appear
                in = {animatePostman}
                timeout = { { exit: 5000} }
                onEntering = { this._animatePostmanEnter }
                onExited = { this._animatePostmanExit }>
                   <Postman />
               </Transition>
            </section>
        )
    }
}