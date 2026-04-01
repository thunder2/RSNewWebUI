const m = require('mithril');
const rs = require('rswebui');
const util = require('forums/forums_util');
const peopleUtil = require('people/people_util');
const { updatedisplayforums, loadPostContent, getTimestampValue, formatTimestamp } = require('./forums_util');

function createforum() {
  let title;
  let body;
  let identity;
  return {
    oninit: (vnode) => {
      if (vnode.attrs.authorId) {
        identity = vnode.attrs.authorId[0];
      }
    },
    view: (vnode) =>
      m('.widget', [
        m('h3', 'Create Forum'),
        m('hr'),
        m('input[type=text][placeholder=Title]', {
          oninput: (e) => (title = e.target.value),
        }),
        m('label[for=tags]', 'Select identity'),
        m(
          'select[id=idtags]',
          {
            value: identity,
            onchange: (e) => {
              identity = vnode.attrs.authorId[e.target.selectedIndex];
            },
          },
          [
            vnode.attrs.authorId &&
            vnode.attrs.authorId.map((o) =>
              m(
                'option',
                { value: o },
                rs.userList.username(o)
                  ? rs.userList.username(o) + ' (' + o.slice(0, 8) + '...)'
                  : 'No Signature'
              )
            ),
          ]
        ),
        m('textarea[rows=5][placeholder=Description]', {
          style: { width: '90%', display: 'block' },
          oninput: (e) => (body = e.target.value),
          value: body,
        }),
        m(
          'button',
          {
            onclick: async () => {
              const res = await rs.rsJsonApiRequest('/rsgxsforums/createForumV2', {
                name: title,
                description: body,
                ...(Number(identity) !== 0 && { authorId: identity }), // if id == '0', authorId is left empty
              });
              if (res.body.retval) {
                util.updatedisplayforums(res.body.forumId);
                m.redraw();
              }
              res.body.retval === false
                ? util.popupmessage([m('h3', 'Error'), m('hr'), m('p', res.body.errorMessage)])
                : util.popupmessage([
                  m('h3', 'Success'),
                  m('hr'),
                  m('p', 'Forum created successfully'),
                ]);
            },
          },
          'Create'
        ),
      ]),
  };
}
const EditThread = () => {
  let title = '';
  let body = '';
  return {
    oninit: (vnode) => {
      title = vnode.attrs.current_title;
      body = vnode.attrs.current_body;
    },
    view: (vnode) =>
      m('.widget', [
        m('h3', 'Edit Thread'),
        m('hr'),

        m(
          'iddisplay',
          {
            style: { display: 'block ruby' }, // same line block ruby
          },
          [
            'Identity: ',
            m('h5[id=authid]', rs.userList.username(vnode.attrs.authorId)),
          ]
        ),
        m(
          'titledisplay',
          {
            style: { display: 'block ruby' },
          },
          [
            'Title: ',
            m('input[type=text][placeholder=Title]', {
              value: vnode.attrs.current_title,
              oninput: (e) => (title = e.target.value),
            }),
          ]
        ),
        m('textarea[rows=5]', {
          style: { width: '90%', display: 'block' },
          oninput: (e) => (body = e.target.value),
          value: vnode.attrs.current_body,
        }),
        m(
          'button',
          {
            onclick: async () => {
              const res = await rs.rsJsonApiRequest('/rsgxsforums/createPost', {
                forumId: vnode.attrs.forumId,
                mBody: body,
                title,
                authorId: vnode.attrs.authorId,
                parentId: vnode.attrs.current_parent,
                origPostId: vnode.attrs.current_msgid,
              });
              res.body.retval === false
                ? util.popupmessage([m('h3', 'Error'), m('hr'), m('p', res.body.errorMessage)])
                : util.popupmessage([
                  m('h3', 'Success'),
                  m('hr'),
                  m('p', 'Thread edited successfully'),
                ]);
              util.updatedisplayforums(vnode.attrs.forumId);
              m.redraw();
            },
          },
          'Add'
        ),
      ]),
  };
};
const AddThread = () => {
  let title = '';
  let body = '';
  let identity;
  return {
    oninit: (vnode) => {
      if (vnode.attrs.authorId) {
        identity = vnode.attrs.authorId[0];
      }
    },
    view: (vnode) =>
      m('.widget', [
        m('h3', 'Add Thread'),
        m('hr'),
        (vnode.attrs.parent_thread !== '') > 0
          ? [m('h5', 'Reply to thread: '), m('p', vnode.attrs.parent_thread)]
          : '',
        m('input[type=text][placeholder=Title]', {
          oninput: (e) => (title = e.target.value),
        }),
        m('label[for=tags]', 'Select identity'),
        m(
          'select[id=idtags]',
          {
            value: identity,
            onchange: (e) => {
              identity = vnode.attrs.authorId[e.target.selectedIndex];
            },
          },
          [
            vnode.attrs.authorId &&
            vnode.attrs.authorId.map((o) =>
              m(
                'option',
                { value: o },
                rs.userList.username(o) + ' (' + o.slice(0, 8) + '...)'
              )
            ),
          ]
        ),
        m('textarea[rows=5]', {
          style: { width: '90%', display: 'block' },
          oninput: (e) => (body = e.target.value),
          value: body,
        }),
        m(
          'button',
          {
            onclick: async () => {
              const res =
                (vnode.attrs.parent_thread !== '') > 0 // is it a reply or a new thread
                  ? await rs.rsJsonApiRequest('/rsgxsforums/createPost', {
                    forumId: vnode.attrs.forumId,
                    mBody: body,
                    title,
                    authorId: identity,
                    parentId: vnode.attrs.parentId,
                  })
                  : await rs.rsJsonApiRequest('/rsgxsforums/createPost', {
                    forumId: vnode.attrs.forumId,
                    mBody: body,
                    title,
                    authorId: identity,
                  });

              res.body.retval === false
                ? util.popupmessage([m('h3', 'Error'), m('hr'), m('p', res.body.errorMessage)])
                : util.popupmessage([
                  m('h3', 'Success'),
                  m('hr'),
                  m('p', 'Thread added successfully'),
                ]);
              util.updatedisplayforums(vnode.attrs.forumId);
              m.redraw();
            },
          },
          'Add'
        ),
      ]),
  };
};

// getTimestampValue and formatTimestamp are imported from forums_util.js

function displaythread() {
  // recursive function to display all the threads
  let groupmessagepair;
  let unread;
  let editpermission = false;
  return {
    view: (v) => {
      const thread = v.attrs.threadStruct.thread;
      groupmessagepair = { first: thread.mMeta.mGroupId, second: thread.mMeta.mOrigMsgId };
      let parMap = [];
      if (util.Data.ParentThreadMap[thread.mMeta.mOrigMsgId]) {
        parMap = util.Data.ParentThreadMap[thread.mMeta.mOrigMsgId];
      }
      unread = thread.mMeta.mMsgStatus === util.THREAD_UNREAD;
      v.attrs.identity &&
        v.attrs.identity.map((val) => {
          if (val.localeCompare(thread.mMeta.mAuthorId) === 0) {
            // if the author of the thread matches one of our own ids
            editpermission = true;
          }
        });
      return [
        m(
          'tr',
          {
            style: unread ? { fontWeight: 'bold' } : '',
          },
          [
            Object.keys(parMap).length // if this thread has some replies
              ? m(
                'td',
                m('i.fas.fa-angle-right', {
                  class: 'fa-rotate-' + (v.attrs.threadStruct.showReplies ? '90' : '0'),
                  style: 'margin-top:12px',
                  onclick: () => {
                    v.attrs.threadStruct.showReplies = !v.attrs.threadStruct.showReplies;
                  },
                })
              )
              : m('td', ''),

            m(
              'td',
              {
                style: {
                  position: 'relative',
                  '--replyDepth': v.attrs.replyDepth,
                  left: 'calc(30px*var(--replyDepth))', // shifts reply by 30 px
                  padding: '10px 0',
                },
              },
              [
                m('div.date', { style: { fontSize: '0.8em', color: '#888' } },
                  formatTimestamp(thread.mMeta.mPublishTs)
                ),
                m('div.title', {
                  style: { fontWeight: 'bold', fontSize: '1.1em', cursor: 'pointer', margin: '5px 0' },
                  onclick: async () => {
                    v.attrs.changeThread(thread.mMeta.mOrigMsgId);
                    if (unread) {
                      const res = await rs.rsJsonApiRequest('/rsgxsforums/markRead', {
                        messageId: groupmessagepair,
                        read: true,
                      });
                      if (res.body.retval) {
                        updatedisplayforums(thread.mMeta.mGroupId);
                        m.redraw();
                      }
                    }
                  },
                  ondblclick: () =>
                    (v.attrs.threadStruct.showReplies = !v.attrs.threadStruct.showReplies),
                }, [
                  thread.mMeta.mMsgName,
                  m('options', { style: 'display:block; margin-top: 5px;' }, [
                    m(
                      'button',
                      {
                        style: 'font-size:12px; margin-right: 5px;',
                        onclick: (e) => {
                          e.stopPropagation();
                          util.popupmessage(
                            m(AddThread, {
                              parent_thread: thread.mMeta.mMsgName,
                              forumId: thread.mMeta.mGroupId,
                              authorId: v.attrs.identity,
                              parentId: thread.mMeta.mMsgId,
                            })
                          );
                        },
                      },
                      'Reply'
                    ),
                    editpermission &&
                    m(
                      'button',
                      {
                        style: 'font-size:12px; margin-right: 5px;',
                        onclick: async (e) => {
                          e.stopPropagation();
                          const body = await loadPostContent(
                            thread.mMeta.mGroupId,
                            thread.mMeta.mOrigMsgId
                          );
                          util.popupmessage(
                            m(EditThread, {
                              current_thread: thread.mMeta.mMsgName,
                              forumId: thread.mMeta.mGroupId,
                              current_title: thread.mMeta.mMsgName,
                              current_body: body || '',
                              authorId: thread.mMeta.mAuthorId,
                              current_parent: thread.mMeta.mParentId,
                              current_msgid: thread.mMeta.mOrigMsgId,
                            })
                          );
                        },
                      },
                      'Edit'
                    ),
                    m(
                      'button',
                      {
                        style: { fontSize: '12px' },
                        onclick: async (e) => {
                          e.stopPropagation();
                          const res = await rs.rsJsonApiRequest('/rsgxsforums/markRead', {
                            messageId: groupmessagepair,
                            read: !unread ? true : false,
                          });

                          if (res.body.retval) {
                            updatedisplayforums(thread.mMeta.mGroupId);
                            m.redraw();
                          }
                        },
                      },
                      unread ? 'Mark Read' : 'Mark Unread'
                    ),
                  ]),
                ]),
                m('div.author', { style: { fontSize: '0.9em', fontStyle: 'italic' } }, rs.userList.username(thread.mMeta.mAuthorId)),
              ]
            ),
          ]
        ),
        v.attrs.threadStruct.showReplies &&
        Object.keys(parMap).map((key, index) =>
          m(displaythread, {
            // recursive call to all replies
            threadStruct: util.Data.Threads[parMap[key].mGroupId][parMap[key].mOrigMsgId],
            replyDepth: v.attrs.replyDepth + 1,
            identity: v.attrs.identity,
            changeThread: v.attrs.changeThread,
          })
        ),
      ];
    },
  };
}

const ThreadView = () => {
  let ownId;
  return {
    showThread: '',
    oninit: (v) => {
      util.updatedisplayforums(v.attrs.forumId);
      peopleUtil.ownIds((data) => {
        ownId = data;
        for (let i = 0; i < ownId.length; i++) {
          if (Number(ownId[i]) === 0) {
            ownId.splice(i, 1);
          }
        }
      });
    },
    view: (v) => {
      const forumId = v.attrs.forumId;
      const msgId = v.attrs.msgId;
      const threadStruct = (util.Data.Threads[forumId] && util.Data.Threads[forumId][msgId]) ? util.Data.Threads[forumId][msgId] : null;

      if (!threadStruct) {
        return m('.widget', [
          m(
            'a[title=Back]',
            {
              onclick: () => m.route.set('/forums/:tab/:mGroupId', {
                tab: m.route.param().tab,
                mGroupId: forumId,
              }),
            },
            m('i.fas.fa-arrow-left')
          ),
          m('h3', 'Loading...'),
        ]);
      }

      const meta = threadStruct.thread.mMeta;
      const unread = meta.mMsgStatus === util.THREAD_UNREAD;

      return m('.widget', { key: msgId }, [
        m(
          'a[title=Back]',
          {
            onclick: () => m.route.set('/forums/:tab/:mGroupId', {
              tab: m.route.param().tab,
              mGroupId: forumId,
            }),
          },
          m('i.fas.fa-arrow-left')
        ),
        m('div.post-header', { style: { margin: '10px 0' } }, [
          m('div.date', { style: { color: '#888', fontSize: '0.9em' } }, formatTimestamp(meta.mPublishTs)),
          m('h4.title', { style: { margin: '5px 0', fontWeight: 'bold' } }, meta.mMsgName),
          m('div.author', { style: { fontStyle: 'italic', fontSize: '1em' } }, rs.userList.username(meta.mAuthorId)),
        ]),
        m('hr'),
        m('div.actions', { style: { marginBottom: '15px' } }, [
          m('button', {
            style: { marginRight: '10px' },
            onclick: () => util.popupmessage(m(AddThread, {
              parent_thread: meta.mMsgName,
              forumId: forumId,
              authorId: ownId,
              parentId: msgId,
            }))
          }, 'Reply'),
          m('button', {
            onclick: async () => {
              const res = await rs.rsJsonApiRequest('/rsgxsforums/markRead', {
                messageId: { first: forumId, second: meta.mOrigMsgId },
                read: !unread,
              });
              if (res.body.retval) {
                util.updatedisplayforums(forumId);
                m.redraw();
              }
            }
          }, unread ? 'Mark Read' : 'Mark Unread'),
        ]),
        m('div.content', {
          style: {
            width: '100%',
            backgroundColor: '#f9f9f9',
            padding: '15px',
            borderRadius: '5px',
            whiteSpace: 'pre-wrap', // Preserve line breaks
            wordBreak: 'break-word',
          }
        }, [
          threadStruct.thread.mMsg !== null
            ? m.trust(threadStruct.thread.mMsg)
            : (loadPostContent(forumId, msgId), m('p', 'Loading content...'))
        ]),
      ]);
    },
  };
};

const ForumView = () => {
  let ownId = '';
  return {
    oninit: (v) => {
      util.updatedisplayforums(v.attrs.id);
      peopleUtil.ownIds((data) => {
        ownId = data;
        for (let i = 0; i < ownId.length; i++) {
          if (Number(ownId[i]) === 0) {
            ownId.splice(i, 1);
          }
        }
      });
    },
    view: (v) => {
      const forumDetails = util.Data.DisplayForums[v.attrs.id] || {
        name: 'Loading...',
        isSubscribed: false,
        created: {},
        activity: {},
        author: '0',
        description: 'Loading...',
      };
      const allPosts = util.Data.Threads[v.attrs.id]
        ? Object.values(util.Data.Threads[v.attrs.id]).map((ts) => ts.thread.mMeta)
        : [];
      const fname = forumDetails.name;
      const fsubscribed = forumDetails.isSubscribed;
      const createDate = forumDetails.created;
      const lastActivity = forumDetails.activity;
      let fauthor = 'Unknown';

      if (rs.userList.userMap[forumDetails.author]) {
        fauthor = rs.userList.userMap[forumDetails.author];
      } else if (Number(forumDetails.author) === 0) {
        fauthor = 'No Contact Author';
      }

      return [
        m(
          'a[title=Back]',
          {
            onclick: () =>
              m.route.set('/forums/:tab', {
                tab: m.route.param().tab,
              }),
          },
          m('i.fas.fa-arrow-left')
        ),

        m('h3', fname),
        m(
          'button',
          {
            onclick: async () => {
              const res = await rs.rsJsonApiRequest('/rsgxsforums/subscribeToForum', {
                forumId: v.attrs.id,
                subscribe: !fsubscribed,
              });
              if (res.body.retval) {
                util.Data.DisplayForums[v.attrs.id].isSubscribed = !fsubscribed;
              }
            },
          },
          fsubscribed ? 'Subscribed' : 'Subscribe'
        ),
        m('[id=forumdetails]', [
          m(
            'p',
            m('b', 'Date created: '),
            formatTimestamp(createDate)
          ),
          m('p', m('b', 'Admin: '), fauthor),
          m(
            'p',
            m('b', 'Last activity: '),
            formatTimestamp(lastActivity)
          ),
        ]),
        m('hr'),
        m('forumdesc', m('b', 'Description: '), forumDetails.description),
        m('hr'),
        m(
          'threaddetails',
          {
            style: 'display:' + (fsubscribed ? 'block' : 'none'),
          },
          m('h3', 'Threads'),
          m(
            'button',
            {
              onclick: () => {
                util.popupmessage(
                  m(AddThread, {
                    parent_thread: '',
                    forumId: v.attrs.id,
                    authorId: ownId,
                    parentId: '',
                  })
                );
              },
            },
            ['New Thread', m('i.fas.fa-pencil-alt')]
          ),
          m('hr'),
          m(
            util.ThreadsTable,
            m(
              'tbody',
              allPosts
                .sort((a, b) => getTimestampValue(b.mPublishTs) - getTimestampValue(a.mPublishTs))
                .map((thread) =>
                  m(
                    'tr',
                    {
                      style:
                        thread.mMsgStatus === util.THREAD_UNREAD ? { fontWeight: 'bold' } : '',
                    },
                    m('td', { style: { padding: '10px 0' } }, [
                      m('div.date', { style: { fontSize: '0.8em', color: '#888' } },
                        formatTimestamp(thread.mPublishTs)
                      ),
                      m('div.title', {
                        style: { fontWeight: 'bold', fontSize: '1.2em', cursor: 'pointer', margin: '5px 0' },
                        onclick: () => {
                          m.route.set('/forums/:tab/:mGroupId/:mMsgId', {
                            tab: m.route.param().tab,
                            mGroupId: v.attrs.id,
                            mMsgId: thread.mOrigMsgId,
                          });
                        },
                      }, thread.mMsgName),
                      m('div.author', { style: { fontSize: '0.9em', fontStyle: 'italic' } }, rs.userList.username(thread.mAuthorId)),
                    ])
                  )
                )
            )
          )
        ),
      ];
    },
  };
};

module.exports = {
  ForumView,
  ThreadView,
  createforum,
};
