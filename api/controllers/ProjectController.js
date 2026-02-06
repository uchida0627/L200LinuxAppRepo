// 監視/デバッグ用途の軽量ログ（必要なら後で完全撤廃）
global.updates = [];

// 上限（ログ要素は“軽い”前提。必要に応じて調整）
const MAX_UPDATES = 200;

// updates.push の代わり（上限超過分だけ先頭から削除）
function pushUpdate(item) {
  global.updates.push(item);
  const overflow = global.updates.length - MAX_UPDATES;
  if (overflow > 0) global.updates.splice(0, overflow);
}

// 「巨大な objects をそのまま updates に入れない」ための安全なサマリ化
function summarizeProjects(projects) {
  // プロジェクト全体を保持しない。最小情報だけ。
  // Waterline モデルのフィールド名が不明なので、存在するものだけ拾う。
  return projects.slice(0, 20).map(p => ({
    id: p && p.id,
    name: p && (p.name || p.title),
    updatedAt: p && p.updatedAt,
  }));
}

// 返却件数の上限（ランダムに 1..5000 は危険なので安全側に固定）
const MAX_RETURN = 50;

module.exports = {

  /**
   * GET /project (一覧API想定)
   */
  getAll: async (req, res) => {
    try {
      // まずは全件ではなく、必要最低限だけ（sort/limit）
      // sort フィールドが無い場合は外してOK
      let projects = await Project.find({})
        .sort('updatedAt DESC')
        .limit(MAX_RETURN);

      // 空なら dataset を投入して再取得
      if (!projects || projects.length === 0) {
        await Utils.GetDataSet();
        projects = await Project.find({})
          .sort('updatedAt DESC')
          .limit(MAX_RETURN);
      }

      // セッションには入れない。必要なら軽いフラグ程度のみ。
      req.session.lastProjectsFetchAt = Date.now();

      // updates は軽いサマリだけをログ（巨大配列を保持しない）
      pushUpdate({
        at: Date.now(),
        type: 'getAll',
        count: projects.length,
        sample: summarizeProjects(projects),
      });

      return res.json(projects);
    } catch (e) {
      // ログに必要なら e.message だけ保存（巨大オブジェクトは保存しない）
      pushUpdate({ at: Date.now(), type: 'getAll_error', message: String(e && e.message) });
      return res.status(404).json({ message: "Not Found" });
    }
  },

  /**
   * GET /project/:id (1件取得)
   * ここで全件 Project.find({}) を行わないのが最大の改善ポイント
   */
  getByProject: async (req, res) => {
    try {
      const id = req.params && req.params.id;
      if (!id) return res.badRequest('id is required');

      // 1件だけ取得
      let project = await Project.findOne({ id });

      // もし存在しない場合、初期データ投入→再取得（要件に合わせる）
      if (!project) {
        // ここが必須でなければ削ってOK
        await Utils.GetDataSet();
        project = await Project.findOne({ id });
      }

      if (!project) {
        return res.badRequest(`Project ${id} not found`);
      }

      // セッションには「最後に見たID」程度
      req.session.lastProjectId = id;

      // updates は軽いログのみ
      pushUpdate({
        at: Date.now(),
        type: 'getByProject',
        id,
      });

      return res.send(project);
    } catch (e) {
      pushUpdate({ at: Date.now(), type: 'getByProject_error', message: String(e && e.message) });
      return res.badRequest(`Project ${req.params && req.params.id} not found`);
    }
  },

  /**
   * GET / (画面表示用)
   */
  displayAll: async function (req, res) {
    try {
      let projects = await Project.find({})
        .sort('updatedAt DESC')
        .limit(MAX_RETURN);

      if (!projects || projects.length === 0) {
        await Utils.GetDataSet();
        projects = await Project.find({})
          .sort('updatedAt DESC')
          .limit(MAX_RETURN);
      }

      req.session.lastProjectsViewAt = Date.now();

      pushUpdate({
        at: Date.now(),
        type: 'displayAll',
        count: projects.length,
        sample: summarizeProjects(projects),
      });

      return res.view('pages/home', { projects });
    } catch (e) {
      pushUpdate({ at: Date.now(), type: 'displayAll_error', message: String(e && e.message) });
      return res.view('pages/home', { projects: [] });
    }
  }
};

//==========
// 以下v1コード
//==========
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
// ``


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
