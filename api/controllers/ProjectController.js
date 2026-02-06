//==========
// V2
//==========

// 何がヒープを消費しているのか確認するためのログ出力
console.log("mem(MB)", Object.fromEntries(
  Object.entries(process.memoryUsage()).map(([k,v]) => [k, Math.round(v/1024/1024)])
));
console.log("updates length", global.updates?.length);
console.log("session keys", req.session && Object.keys(req.session));
console.log("session.projects size approx",
  req.session?.projects ? JSON.stringify(req.session.projects).length : 0
);

// global.updates 自体、今回の用途では不要。まずは消すのが最も安全。
// どうしても残すなら “小さいログ” だけ保持する

module.exports = {
  getAll: async (req, res) => {
    try {
      const n = Utils.GetNumber();             // 1..5000
      // DBから全部取って slice しない。最初から limit する。
      const projects = await Project.find({}).limit(n);

      // セッションには巨大オブジェクトを入れない
      req.session.projectCount = projects.length;

      return res.json(projects);
    } catch (e) {
      return res.json({ message: "Not Found" });
    }
  },

  getByProject: async (req, res) => {
    try {
      if (!req.params.id) return res.badRequest("id required");

      // まず対象を取る（全件findは不要）
      const project = await Project.findOne({ id: req.params.id });

      if (!project) return res.badRequest(`Project ${req.params.id} not found`);

      // 空DB時だけ seed
      // （※本当に必要なら count で判定）
      return res.send(project);
    } catch (e) {
      return res.badRequest(`Project ${req.params.id} not found`);
    }
  },
};

// ==========
// 以下v1コード
// ==========
// // 既存のまま global に置く（「やめる」は次段で、まずは上限付けの検証）
// global.updates = [];

// // 上限（まずは検証しやすい値に。必要に応じて調整）
// const MAX_UPDATES = 200;

// // updates.push と同等の「追加」を行い、上限超過分だけ古い要素を削除する
// function pushUpdate(item) {
//   // 元のコードと同じく配列末尾に追加
//   global.updates.push(item);

//   // 上限を超えたら、超過分だけ先頭（古いもの）を削除
//   // splice は配列を in-place で変更する（＝updates参照は維持される）[1](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/splice)
//   const overflow = global.updates.length - MAX_UPDATES;
//   if (overflow > 0) {
//     global.updates.splice(0, overflow);
//   }
// }

// /**
//  * ProjectController
//  */
// module.exports = {
//   getAll: async (req, res) => {
//     try {
//       const projects = await Project.find({});

//       if (typeof req.session.projects === 'undefined') {
//         req.session.projects = projects;
//       } else {
//         req.session.projects = projects;
//         pushUpdate(Utils.Filter(global.updates, req.session.projects)); // ★ここだけ updates.push → pushUpdate
//         req.session.projects = global.updates;                          // 元の挙動そのまま
//       }

//       if (projects.length <= 0) {
//         Utils.GetDataSet();
//       } else {
//         pushUpdate(Utils.Filter(global.updates, projects));             // ★ここだけ updates.push → pushUpdate
//         const projectsList = projects.slice(0, Utils.GetNumber());
//         return res.json(projectsList);
//       }
//     } catch (e) {
//       return res.json({ message: "Not Found" });
//     }
//   },

//   getByProject: async (req, res) => {
//     try {
//       if (req.params.id) {
//         const projects = await Project.find({});

//         if (typeof req.session.projects === 'undefined') {
//           req.session.projects = projects;
//         } else {
//           req.session.projects = projects;
//           pushUpdate(Utils.Filter(global.updates, req.session.projects)); // ★
//           req.session.projects = global.updates;                          // 元の挙動そのまま
//         }

//         if (projects.length <= 0) {
//           Utils.GetDataSet();
//         }

//         pushUpdate(Utils.Filter(global.updates, projects));               // ★
//         const project = await Project.findOne({ id: req.params.id });
//         return res.send(project);
//       }
//     } catch (e) {
//       console.log(e);
//       return res.badRequest(`Project ${req.params.id} not found`);
//     }
//   },

//   displayAll: async function (req, res) {
//     try {
//       const projects = await Project.find({});

//       if (typeof req.session.projects === 'undefined') {
//         req.session.projects = projects;
//       } else {
//         req.session.projects = projects;
//         pushUpdate(Utils.Filter(global.updates, req.session.projects)); // ★
//         req.session.projects = global.updates;                          // 元の挙動そのまま
//       }

//       if (projects.length <= 0) {
//         Utils.GetDataSet();
//       } else {
//         pushUpdate(Utils.Filter(global.updates, projects));             // ★
//         const projectsList = projects.slice(0, Utils.GetNumber());
//         return res.view('pages/home', { projects: projectsList });
//       }

//     } catch (e) {
//       return res.view('pages/home', { projects: [] });
//     }
//   }
// };
``


//==========
// 以下オリジナルコード
//==========
  
// global.updates = [];

// /**
//  * ProjectController
//  *
//  * @description :: Server-side actions for handling incoming requests.
//  * @help        :: See https://sailsjs.com/docs/concepts/actions
//  */

// module.exports = {
//     getAll: async (req, res) => {
//         try{

//             let projects = await Project.find({}); 

//             if(typeof req.session.projects === 'undefined'){
//                 req.session.projects = projects;
//             }
//             else
//             {
//                 req.session.projects = projects;
//                 updates.push(Utils.Filter(updates, req.session.projects));
//                 req.session.projects = updates;
//             }

//             if (projects.length <= 0){
//                 Utils.GetDataSet();
//             }  
//             else {
//                 updates.push(Utils.Filter(updates, projects));
//                 var projectsList = projects.slice(0, Utils.GetNumber());
//                 res.json(projectsList);
//             }
//         } catch(e){
//             return res.json({ message: "Not Found"});
//         }
//     } ,
//     getByProject: async (req, res) => {
//         try {
//             if(req.params.id){
//                 let projects = await Project.find({});  
//                 if(typeof req.session.projects === 'undefined'){
//                     req.session.projects = projects;
//                 }
//                 else
//                 {
//                     req.session.projects = projects;
//                     updates.push(Utils.Filter(updates, req.session.projects));
//                     req.session.projects = updates;
//                 }

//                 if (projects.length <= 0){
//                     Utils.GetDataSet();
//                 }
//                 updates.push(Utils.Filter(updates, projects));
//                 let project = await Project.findOne({id: req.params.id});
//                 return res.send(project);
//             } 
//         } catch(e){
//             console.log(e);
//             return res.badRequest(`Project ${req.params.id} not found`);
//         }
//     },
//     displayAll: async function(req, res){
//         try{
//             let projects = await Project.find({});
//             if(typeof req.session.projects === 'undefined'){
//                 req.session.projects = projects;
//             }
//             else
//             {
//                 req.session.projects = projects;
//                 updates.push(Utils.Filter(updates, req.session.projects));
//                 req.session.projects = updates;
//             }

//             if (projects.length <= 0){
//                 Utils.GetDataSet();
//             }
//             else {
//                 updates.push(Utils.Filter(updates, projects));
//                 var projectsList = projects.slice(0, Utils.GetNumber());
//                 res.view('pages/home', { projects: projectsList});
//             }
               
//         } catch(e){
//             res.view('pages/home', { projects: []});
//         }
//     }
// };
