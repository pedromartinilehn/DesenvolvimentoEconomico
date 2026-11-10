import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt, sys
OUT=sys.argv[1]
NAVY,ORANGE,GRAY,MID,LIGHT,TEXT='#143C8C','#E8631A','#5F6878','#3F5FA8','#A9BBDF','#2B2F36'
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'axes.spines.top':False,'axes.spines.right':False,'axes.edgecolor':'#C9D0DB','axes.labelcolor':TEXT,'xtick.color':TEXT,'ytick.color':TEXT})
br=lambda v,d=1:f'{v:,.{d}f}'.replace(',','X').replace('.',',').replace('X','.')
def fim(fig,nome):
    fig.tight_layout(); fig.savefig(f'{OUT}/{nome}.png',dpi=200); plt.close(fig)

# 1. composição do BP
datas=['Dez/24','Dez/25','Jun/25','Jun/26']; tot=[3377,3831,3326,3710]
ac=[59.6,60.0,57.5,58.9]; pc=[35.1,34.5,32.8,33.7]; pnc=[28.4,32.1,30.1,30.8]; pl=[36.6,33.5,37.1,35.5]
fig,ax=plt.subplots(1,2,figsize=(9,3.4))
x=range(4)
ax[0].bar(x,ac,color=NAVY,width=.6,label='Ativo circulante',edgecolor='white',linewidth=2)
ax[0].bar(x,[100-a for a in ac],bottom=ac,color=LIGHT,width=.6,label='Ativo não circulante',edgecolor='white',linewidth=2)
for i in x:
    ax[0].text(i,ac[i]/2,br(ac[i])+'%',ha='center',va='center',color='white',fontsize=9)
    ax[0].text(i,ac[i]+(100-ac[i])/2,br(100-ac[i])+'%',ha='center',va='center',color=TEXT,fontsize=9)
ax[0].set_title('Composição do ativo',color=NAVY,fontsize=11,loc='left')
b1=pc; b2=[a+b for a,b in zip(pc,pnc)]
ax[1].bar(x,pc,color=ORANGE,width=.6,label='Passivo circulante',edgecolor='white',linewidth=2)
ax[1].bar(x,pnc,bottom=b1,color=GRAY,width=.6,label='Passivo não circulante',edgecolor='white',linewidth=2)
ax[1].bar(x,pl,bottom=b2,color=NAVY,width=.6,label='Patrimônio líquido',edgecolor='white',linewidth=2)
for i in x:
    for v,b in ((pc[i],0),(pnc[i],b1[i]),(pl[i],b2[i])): ax[1].text(i,b+v/2,br(v)+'%',ha='center',va='center',color='white',fontsize=9)
ax[1].set_title('Composição do passivo + PL',color=NAVY,fontsize=11,loc='left')
for a in ax:
    a.set_xticks(list(x)); a.set_xticklabels([f'{d}\nR$ {br(t,0)} mi' for d,t in zip(datas,tot)],fontsize=8.5); a.set_yticks([]); a.spines['left'].set_visible(False)
    a.legend(loc='upper center',bbox_to_anchor=(.5,-.22),ncol=3,frameon=False,fontsize=8)
fim(fig,'g1_bp')

# 2. prazos
per=['2024','2025','2T25\n(LTM)','2T26\n(LTM)','9M25','9M26']
pmre=[114.8,111.9,109.8,103.4,115.7,107.4]; pmrv=[30.3,30.9,27.4,28.6,29.5,31.9]; pmpc=[67.0,65.2,58.9,54.5,64.1,60.7]; cf=[78.2,77.6,78.3,77.5,81.1,78.6]
fig,ax=plt.subplots(figsize=(9,3.4)); w=.26
import numpy as np; xi=np.arange(6)
for k,(v,c,n) in enumerate(((pmre,NAVY,'Estoque (PMRE)'),(pmrv,LIGHT,'Recebíveis (PMRV)'),(pmpc,ORANGE,'Fornecedores (PMPC)'))):
    bs=ax.bar(xi+(k-1)*w,v,w-.03,color=c,label=n)
    for b,val in zip(bs,v): ax.text(b.get_x()+b.get_width()/2,val+1.5,br(val,0),ha='center',fontsize=7.5,color=TEXT)
for i in xi: ax.text(i,128,f'CF {br(cf[i])} d',ha='center',fontsize=8.5,color=NAVY,fontweight='bold')
ax.set_xticks(xi); ax.set_xticklabels(per,fontsize=8.5); ax.set_ylim(0,136); ax.set_ylabel('dias')
ax.legend(loc='upper center',bbox_to_anchor=(.5,-.2),ncol=3,frameon=False,fontsize=8.5)
fim(fig,'g2_prazos')

# 3. NCG x CDG
d3=['Dez/24','Jun/25','Set/25','Dez/25','Jun/26','Set/26']; ncg=[901.5,902.0,894.3,904.4,974.7,995.7]; cdg=[827.9,823.0,1020.9,976.9,935.4,902.8]
fig,ax=plt.subplots(figsize=(9,3.3)); xi=np.arange(6); w=.36
ax.bar(xi-w/2,ncg,w-.03,color=ORANGE,label='NCG'); ax.bar(xi+w/2,cdg,w-.03,color=NAVY,label='CDG')
TT=[-73.6,-79.1,126.6,72.5,-39.3,-92.9]
for i in xi:
    t=TT[i]; ax.text(i,max(ncg[i],cdg[i])+25,f'T {"+" if t>0 else "−"}{br(abs(t))}',ha='center',fontsize=8.5,color=NAVY if t>0 else ORANGE,fontweight='bold')
ax.set_xticks(xi); ax.set_xticklabels(d3); ax.set_ylim(0,1150); ax.set_ylabel('R$ milhões')
ax.legend(loc='upper left',frameon=False,ncol=2)
fim(fig,'g3_ncg')

# 4. benchmark 3T26
emp=['Panvel','RD Saúde','Pague Menos']; pme=[97,102.4,103]; pmr=[30,27.6,32]; pmp=[55,75.8,63]; cc=[72,54.2,72]
fig,ax=plt.subplots(figsize=(9,3.0)); xi=np.arange(3); w=.26
for k,(v,c,n) in enumerate(((pme,NAVY,'Estoques'),(pmr,LIGHT,'Recebíveis'),(pmp,ORANGE,'Fornecedores'))):
    bs=ax.bar(xi+(k-1)*w,v,w-.03,color=c,label=n)
    for b,val in zip(bs,v): ax.text(b.get_x()+b.get_width()/2,val+1.5,br(val,1 if val%1 else 0),ha='center',fontsize=8)
for i in xi: ax.text(i,118,f'Ciclo de caixa {br(cc[i],1 if cc[i]%1 else 0)} d',ha='center',fontsize=9,color=NAVY,fontweight='bold')
ax.set_xticks(xi); ax.set_xticklabels(emp); ax.set_ylim(0,126); ax.set_ylabel('dias (divulgados, 3T26)')
ax.legend(loc='upper center',bbox_to_anchor=(.5,-.13),ncol=3,frameon=False,fontsize=8.5)
fim(fig,'g4_bench')

# 5. EBITDA LTM por UF
uf=['RS','SC','PR','SP']; eb=[12.6,11.2,9.2,6.2]; mad=[83.7,75.2,72.3,47.1]
fig,ax=plt.subplots(figsize=(9,2.8))
bs=ax.bar(uf,eb,.55,color=[NAVY,MID,MID,GRAY])
for b,e,m in zip(bs,eb,mad):
    ax.text(b.get_x()+b.get_width()/2,e+.3,br(e)+'%',ha='center',fontsize=10,fontweight='bold',color=TEXT)
    ax.text(b.get_x()+b.get_width()/2,e/2,f'{br(m)}%\nmaduras',ha='center',va='center',fontsize=8.5,color='white')
ax.set_ylim(0,15); ax.set_yticks([]); ax.spines['left'].set_visible(False)
ax.set_title('EBITDA LTM 3T26 por UF (dentro da barra: lojas maduras)',color=NAVY,fontsize=10.5,loc='left')
fim(fig,'g5_ebitda')
print('ok')
