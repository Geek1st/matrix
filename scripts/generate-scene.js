/**
 * Matrix Match-3 Scene Generator — 固定索引, AI 可编辑
 * node scripts/generate-scene.js
 */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');

// 脚本 UUID
const UUIDS = {};
(function scan(d) { for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory()&&e.name!=='node_modules') scan(p);else if(e.name.endsWith('.ts.meta')) UUIDS[path.basename(e.name,'.ts.meta')]=JSON.parse(fs.readFileSync(p,'utf-8')).uuid} })(path.join(ROOT,'assets/scripts'));

// 快捷构造
const V3=(x,y,z)=>({__type__:'cc.Vec3',x,y,z});
const Q=()=>({__type__:'cc.Quat',x:0,y:0,z:0,w:1});
const R=(n)=>n!=null?{__id__:n}:null;
const RS=(arr)=>arr.map(n=>({__id__:n}));

const obj = [
    // [0] SceneAsset
    {__type__:'cc.SceneAsset',_name:'main',_objFlags:0,_native:'',_scene:{__id__:1}},
    // [1] Scene
    {__type__:'cc.Scene',_name:'main',_objFlags:0,_parent:null,_children:RS([2]),_active:true,_components:[],_prefab:null,_lpos:V3(0,0,0),_lrot:Q(),_lscale:V3(1,1,1),_mobility:0,_layer:1073741824,_euler:V3(0,0,0),autoReleaseAssets:false,_globals:{__id__:12},_id:'ac026b23-e401-4389-b0dd-309b2eb02c16'},
    // [2] Canvas
    {__type__:'cc.Node',_name:'Canvas',_objFlags:0,_parent:{__id__:1},_children:RS([3,4,5,6,7,8,9,10,11]),_active:true,_components:RS([30,31,32]),_prefab:null,_lpos:V3(480,320,0),_lrot:Q(),_lscale:V3(1,1,1),_mobility:0,_layer:33554432,_euler:V3(0,0,0),_id:'canvas'},
    // [3] Camera
    {__type__:'cc.Node',_name:'Camera',_objFlags:0,_parent:{__id__:2},_children:[],_active:true,_components:RS([13]),_prefab:null,_lpos:V3(0,0,1000),_lrot:Q(),_lscale:V3(1,1,1),_mobility:0,_layer:1073741824,_euler:V3(0,0,0),_id:'camera'},
    // [4] ScoreLabel
    {__type__:'cc.Node',_name:'ScoreLabel',_objFlags:0,_parent:{__id__:2},_children:[],_active:true,_components:RS([14,15]),_prefab:null,_lpos:V3(0,280,0),_lrot:Q(),_lscale:V3(1,1,1),_mobility:0,_layer:33554432,_euler:V3(0,0,0),_id:'score'},
    // [5] MovesLabel
    {__type__:'cc.Node',_name:'MovesLabel',_objFlags:0,_parent:{__id__:2},_children:[],_active:true,_components:RS([16,17]),_prefab:null,_lpos:V3(0,240,0),_lrot:Q(),_lscale:V3(1,1,1),_mobility:0,_layer:33554432,_euler:V3(0,0,0),_id:'moves'},
    // [6] ComboLabel
    {__type__:'cc.Node',_name:'ComboLabel',_objFlags:0,_parent:{__id__:2},_children:[],_active:true,_components:RS([18,19]),_prefab:null,_lpos:V3(0,200,0),_lrot:Q(),_lscale:V3(1,1,1),_mobility:0,_layer:33554432,_euler:V3(0,0,0),_id:'combo'},
    // [7] BoardArea
    {__type__:'cc.Node',_name:'BoardArea',_objFlags:0,_parent:{__id__:2},_children:[],_active:true,_components:RS([20,21,22]),_prefab:null,_lpos:V3(0,0,0),_lrot:Q(),_lscale:V3(1,1,1),_mobility:0,_layer:33554432,_euler:V3(0,0,0),_id:'board'},
    // [8] GameManager
    {__type__:'cc.Node',_name:'GameManager',_objFlags:0,_parent:{__id__:2},_children:[],_active:true,_components:RS([23]),_prefab:null,_lpos:V3(0,-500,0),_lrot:Q(),_lscale:V3(1,1,1),_mobility:0,_layer:33554432,_euler:V3(0,0,0),_id:'gm'},
    // [9] ScoreManager
    {__type__:'cc.Node',_name:'ScoreManager',_objFlags:0,_parent:{__id__:2},_children:[],_active:true,_components:RS([24]),_prefab:null,_lpos:V3(0,-520,0),_lrot:Q(),_lscale:V3(1,1,1),_mobility:0,_layer:33554432,_euler:V3(0,0,0),_id:'sm'},
    // [10] HintButton
    {__type__:'cc.Node',_name:'HintButton',_objFlags:0,_parent:{__id__:2},_children:[],_active:true,_components:RS([25,26,27]),_prefab:null,_lpos:V3(200,280,0),_lrot:Q(),_lscale:V3(1,1,1),_mobility:0,_layer:33554432,_euler:V3(0,0,0),_id:'hint'},
    // [11] GameOverLabel
    {__type__:'cc.Node',_name:'GameOverLabel',_objFlags:0,_parent:{__id__:2},_children:[],_active:false,_components:RS([28,29]),_prefab:null,_lpos:V3(0,0,0),_lrot:Q(),_lscale:V3(1,1,1),_mobility:0,_layer:33554432,_euler:V3(0,0,0),_id:'gameover'},
    // [12] SceneGlobals
    {__type__:'cc.SceneGlobals',ambient:{__id__:33},_skybox:{__id__:34},_id:'globals'},
    // [13] Camera Component
    {__type__:'cc.Camera',_name:'',_objFlags:0,node:{__id__:3},_enabled:true,__prefab:null,_projection:0,_priority:0,_fov:45,_fovAxis:0,_orthoHeight:320,_near:1,_far:2000,_color:{__type__:'cc.Color',r:51,g:51,b:51,a:255},_depth:1,_stencil:0,_clearFlags:7,_rect:{__type__:'cc.Rect',x:0,y:0,width:1,height:1},_aperture:19,_shutter:7,_iso:0,_screenScale:1,_visibility:1108344832,_targetTexture:null,_id:'cam-comp'},
    // [14] Score UITransform
    {__type__:'cc.UITransformComponent',_name:'',_objFlags:0,node:{__id__:4},_enabled:true,__prefab:null,_contentSize:{__type__:'cc.Size',width:300,height:50},_anchorPoint:{__type__:'cc.Vec2',x:.5,y:.5},_id:'s-uit'},
    // [15] Score Label
    {__type__:'cc.Label',_name:'',_objFlags:0,node:{__id__:4},_enabled:true,__prefab:null,_string:'Score: 0',_horizontalAlign:1,_verticalAlign:1,_actualFontSize:28,_fontSize:28,_fontFamily:'Arial',_lineHeight:28,_overflow:0,_enableWrapText:false,_font:null,_isSystemFontUsed:true,_spacingX:0,_isItalic:false,_isBold:true,_isUnderline:false,_underlineHeight:2,_cacheMode:0,_color:{__type__:'cc.Color',r:255,g:215,b:0,a:255},_id:'s-lbl'},
    // [16] Moves UITransform
    {__type__:'cc.UITransformComponent',_name:'',_objFlags:0,node:{__id__:5},_enabled:true,__prefab:null,_contentSize:{__type__:'cc.Size',width:300,height:40},_anchorPoint:{__type__:'cc.Vec2',x:.5,y:.5},_id:'m-uit'},
    // [17] Moves Label
    {__type__:'cc.Label',_name:'',_objFlags:0,node:{__id__:5},_enabled:true,__prefab:null,_string:'Moves: 30',_horizontalAlign:1,_verticalAlign:1,_actualFontSize:22,_fontSize:22,_fontFamily:'Arial',_lineHeight:22,_overflow:0,_enableWrapText:false,_font:null,_isSystemFontUsed:true,_spacingX:0,_isItalic:false,_isBold:false,_isUnderline:false,_underlineHeight:2,_cacheMode:0,_color:{__type__:'cc.Color',r:170,g:170,b:255,a:255},_id:'m-lbl'},
    // [18] Combo UITransform
    {__type__:'cc.UITransformComponent',_name:'',_objFlags:0,node:{__id__:6},_enabled:true,__prefab:null,_contentSize:{__type__:'cc.Size',width:300,height:40},_anchorPoint:{__type__:'cc.Vec2',x:.5,y:.5},_id:'c-uit'},
    // [19] Combo Label
    {__type__:'cc.Label',_name:'',_objFlags:0,node:{__id__:6},_enabled:true,__prefab:null,_string:'',_horizontalAlign:1,_verticalAlign:1,_actualFontSize:26,_fontSize:26,_fontFamily:'Arial',_lineHeight:26,_overflow:0,_enableWrapText:false,_font:null,_isSystemFontUsed:true,_spacingX:0,_isItalic:false,_isBold:true,_isUnderline:false,_underlineHeight:2,_cacheMode:0,_color:{__type__:'cc.Color',r:255,g:102,b:0,a:255},_id:'c-lbl'},
    // [20] Board UITransform
    {__type__:'cc.UITransformComponent',_name:'',_objFlags:0,node:{__id__:7},_enabled:true,__prefab:null,_contentSize:{__type__:'cc.Size',width:480,height:480},_anchorPoint:{__type__:'cc.Vec2',x:.5,y:.5},_id:'b-uit'},
    // [21] BoardManager Script
    {__type__:UUIDS['BoardManager']||'missing',_name:'',_objFlags:0,node:{__id__:7},_enabled:true,__prefab:null,_id:'b-scr'},
    // [22] InputHandler Script
    {__type__:UUIDS['InputHandler']||'missing',_name:'',_objFlags:0,node:{__id__:7},_enabled:true,__prefab:null,_id:'i-scr'},
    // [23] GameManager Script
    {__type__:UUIDS['GameManager']||'missing',_name:'',_objFlags:0,node:{__id__:8},_enabled:true,__prefab:null,_id:'g-scr'},
    // [24] ScoreManager Script
    {__type__:UUIDS['ScoreManager']||'missing',_name:'',_objFlags:0,node:{__id__:9},_enabled:true,__prefab:null,_id:'sm-scr'},
    // [25] Hint UITransform
    {__type__:'cc.UITransformComponent',_name:'',_objFlags:0,node:{__id__:10},_enabled:true,__prefab:null,_contentSize:{__type__:'cc.Size',width:80,height:40},_anchorPoint:{__type__:'cc.Vec2',x:.5,y:.5},_id:'h-uit'},
    // [26] Hint Label
    {__type__:'cc.Label',_name:'',_objFlags:0,node:{__id__:10},_enabled:true,__prefab:null,_string:'Hint',_horizontalAlign:1,_verticalAlign:1,_actualFontSize:18,_fontSize:18,_fontFamily:'Arial',_lineHeight:18,_overflow:0,_enableWrapText:false,_font:null,_isSystemFontUsed:true,_spacingX:0,_isItalic:false,_isBold:false,_isUnderline:false,_underlineHeight:2,_cacheMode:0,_color:{__type__:'cc.Color',r:0,g:255,b:136,a:255},_id:'h-lbl'},
    // [27] HintSystem Script
    {__type__:UUIDS['HintSystem']||'missing',_name:'',_objFlags:0,node:{__id__:10},_enabled:true,__prefab:null,_id:'h-scr'},
    // [28] GameOver UITransform
    {__type__:'cc.UITransformComponent',_name:'',_objFlags:0,node:{__id__:11},_enabled:true,__prefab:null,_contentSize:{__type__:'cc.Size',width:500,height:200},_anchorPoint:{__type__:'cc.Vec2',x:.5,y:.5},_id:'go-uit'},
    // [29] GameOver Label
    {__type__:'cc.Label',_name:'',_objFlags:0,node:{__id__:11},_enabled:true,__prefab:null,_string:'Game Over!',_horizontalAlign:1,_verticalAlign:1,_actualFontSize:40,_fontSize:40,_fontFamily:'Arial',_lineHeight:40,_overflow:0,_enableWrapText:false,_font:null,_isSystemFontUsed:true,_spacingX:0,_isItalic:false,_isBold:true,_isUnderline:false,_underlineHeight:2,_cacheMode:0,_color:{__type__:'cc.Color',r:255,g:68,b:68,a:255},_id:'go-lbl'},
    // [30] Canvas UITransform
    {__type__:'cc.UITransformComponent',_name:'',_objFlags:0,node:{__id__:2},_enabled:true,__prefab:null,_contentSize:{__type__:'cc.Size',width:960,height:640},_anchorPoint:{__type__:'cc.Vec2',x:.5,y:.5},_id:'cv-uit'},
    // [31] Canvas Component
    {__type__:'cc.Canvas',_name:'',_objFlags:0,node:{__id__:2},_enabled:true,__prefab:null,_cameraComponent:{__id__:13},_alignCanvasWithScreen:true,_id:'cv-comp'},
    // [32] Canvas Widget
    {__type__:'cc.Widget',_name:'',_objFlags:0,node:{__id__:2},_enabled:true,__prefab:null,_alignFlags:45,_target:null,_left:0,_right:0,_top:0,_bottom:0,_horizontalCenter:0,_verticalCenter:0,_isAbsLeft:true,_isAbsRight:true,_isAbsTop:true,_isAbsBottom:true,_isAbsHorizontalCenter:true,_isAbsVerticalCenter:true,_originalWidth:960,_originalHeight:640,_id:'cv-widget'},
    // [33] Ambient
    {__type__:'cc.AmbientInfo',_skyColorHDR:{__type__:'cc.Vec4',x:.2,y:.5,z:.8,w:.52},_skyColor:{__type__:'cc.Vec4',x:.2,y:.5,z:.8,w:.52},_skyIllumHDR:{__type__:'cc.Vec4',x:.2,y:.5,z:.8,w:.52},_skyIllum:{__type__:'cc.Vec4',x:.2,y:.5,z:.8,w:.52},_groundAlbedoHDR:{__type__:'cc.Vec4',x:.2,y:.2,z:.2,w:1},_groundAlbedo:{__type__:'cc.Vec4',x:.2,y:.2,z:.2,w:1},_skyColorLDR:{__type__:'cc.Vec4',x:.2,y:.5,z:.8,w:.52},_skyIllumLDR:{__type__:'cc.Vec4',x:.2,y:.5,z:.8,w:.52},_groundAlbedoLDR:{__type__:'cc.Vec4',x:.2,y:.2,z:.2,w:1},_id:'ambient'},
    // [34] Skybox
    {__type__:'cc.SkyboxInfo',_envLightingType:0,_envmapHDR:null,_envmap:null,_diffuseMapHDR:null,_diffuseMap:null,_useIBL:false,_id:'skybox'},
];

fs.writeFileSync(path.join(ROOT,'assets','scene','main.scene'), JSON.stringify(obj,null,2),'utf-8');
console.log(`\n✅ Scene: ${obj.length} objects → assets/scene/main.scene`);
console.log('   Nodes: Canvas→Camera, ScoreLabel, MovesLabel, ComboLabel, BoardArea(+2 scripts), GameManager, ScoreManager, HintButton, GameOverLabel');
