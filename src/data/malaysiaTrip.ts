import { Trip } from '../types';

export const malaysiaTrip: Trip = {
  id: 'malaysia-2024',
  name: '马来西亚之旅（4.25-5.5）',
  cover: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&q=80&w=400',
  status: '进行中',
  budget: 12500,
  collaborators: [
    { id: '1', name: '我 (管理员)', avatar: 'https://picsum.photos/seed/user1/100/100', role: 'admin', email: 'admin@example.com' },
    { id: '2', name: '小明', avatar: 'https://picsum.photos/seed/user2/100/100', role: 'editor', email: 'xiaoming@example.com' },
    { id: '3', name: '小红', avatar: 'https://picsum.photos/seed/user3/100/100', role: 'viewer', email: 'xiaohong@example.com' },
  ],
  itinerary: [
    { 
      id: 1, date: '4月25日', day: '周六', location: '亚庇', title: '亚庇：抵达与市内深度游', 
      details: [
        { id: 'd1-1', time: '00:15-05:40', iconName: 'Plane', text: '北京✈️亚庇 AK1561', sub: '抵达 T1 航站楼', isTransport: true },
        { id: 'd1-2', time: '06:00-07:00', iconName: 'Clock', text: '行李寄存', sub: '亚路轩酒店' },
        { id: 'd1-3', time: '07:30', iconName: 'Utensils', text: '加雅街早餐', sub: '怡丰茶室或富源茶室' },
        { id: 'd1-4', time: '09:00-12:00', iconName: 'MapPin', text: '市内游：清真寺打卡', sub: '水上/粉红清真寺' },
        { id: 'd1-5', time: '17:00-19:00', iconName: 'Sunset', text: '丹绒亚路海滩', sub: '桨板落日拍照' }
      ]
    },
    { 
      id: 2, date: '4月26日', day: '周日', location: '亚庇', title: '亚庇：大王花 & KAWA 红树林', 
      details: [
        { id: 'd2-1', time: '09:00', iconName: 'MapPin', text: '大王花基地', sub: '寻找巨花' },
        { id: 'd2-2', time: '13:30', iconName: 'Camera', text: '外观水上清真寺', sub: '打卡拍照' },
        { id: 'd2-3', time: '14:00', iconName: 'Car', text: '出发去 KAWA 红树林', sub: '车程约1.5h', isTransport: true },
        { id: 'd2-4', time: '15:45', iconName: 'Coffee', text: '码头下午茶', sub: '特色茶点' },
        { id: 'd2-5', time: '16:10', iconName: 'Ship', text: '游船寻找长鼻猴', sub: '雨林探险' },
        { id: 'd2-6', time: '17:00', iconName: 'Utensils', text: '晚餐', sub: '当地简餐' },
        { id: 'd2-7', time: '17:30', iconName: 'Sunset', text: '海滩日落', sub: '看夕阳' },
        { id: 'd2-8', time: '19:00', iconName: 'Sparkles', text: '夜观萤火虫', sub: '梦幻森林' },
        { id: 'd2-9', time: '19:30-21:30', iconName: 'Car', text: '回程酒店', sub: '返程', isTransport: true }
      ]
    },
    { 
      id: 3, date: '4月27日', day: '周一', location: '仙本那', title: '转移：亚庇飞往仙本那', 
      details: [
        { id: 'd3-1', time: '15:35', iconName: 'Plane', text: '亚庇✈️仙本那 OD1702', isTransport: true },
        { id: 'd3-2', time: '16:45', iconName: 'Car', text: '拼车至仙本那镇', sub: '1.5h', isTransport: true }
      ]
    },
    { 
      id: 4, date: '4月28日', day: '周二', location: '仙本那', title: '出海：马达京三岛跳岛', 
      details: [{ id: 'd4-1', time: '08:30-15:30', iconName: 'MapPin', text: '马达京三岛', sub: '潜水+拍照' }]
    },
    { 
      id: 5, date: '4月29日', day: '周三', location: '吉隆坡', title: '跳岛 & 飞往吉隆坡', 
      details: [
        { id: 'd5-1', time: '08:30', iconName: 'MapPin', text: '马布岛游玩' },
        { id: 'd5-3', time: '19:50', iconName: 'Plane', text: '斗湖✈️吉隆坡 AK9573', isTransport: true }
      ]
    },
    { 
      id: 6, date: '4月30日', day: '周四', location: '吉隆坡', title: '吉隆坡：市区深度游', 
      details: [{ id: 'd6-1', time: '全天', iconName: 'MapPin', text: 'KL市区漫游', sub: '双子塔等' }]
    },
    { 
      id: 7, date: '5月1日', day: '周五', location: '槟城', title: '马六甲一日游 & 飞槟城', 
      details: [
        { id: 'd7-1', time: '10:00', iconName: 'Car', text: '马六甲游览', isTransport: true },
        { id: 'd7-3', time: '23:40', iconName: 'Plane', text: '吉隆坡✈️槟城', isTransport: true }
      ]
    },
    { 
      id: 8, date: '5月2日', day: '周六', location: '槟城', title: '槟城：古城美食', 
      details: [{ id: 'd8-1', time: '全天', iconName: 'Utensils', text: '逛吃乔治镇' }]
    },
    { 
      id: 9, date: '5月3日', day: '周日', location: '成都', title: '回国：飞往成都转场九寨', 
      details: [
        { id: 'd9-1', time: '01:00', iconName: 'Plane', text: '槟城✈️成都', isTransport: true },
        { id: 'd9-2', time: '14:00', iconName: 'TrainFront', text: '成都-九寨高铁', isTransport: true }
      ]
    },
    { 
      id: 10, date: '5月4日', day: '周一', location: '九寨沟', title: '九寨沟：景区全天游', 
      details: [{ id: 'd10-1', time: '全天', iconName: 'MapPin', text: '九寨沟一日游' }]
    },
    { 
      id: 11, date: '5月5日', day: '周二', location: '北京', title: '完美收官', 
      details: [
        { id: 'd11-1', time: '09:41', iconName: 'TrainFront', text: '九寨-成都高铁', isTransport: true },
        { id: 'd11-3', time: '20:30', iconName: 'Plane', text: '成都✈️北京', isTransport: true }
      ]
    }
  ]
};
